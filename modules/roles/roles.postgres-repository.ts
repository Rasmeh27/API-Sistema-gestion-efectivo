import { PoolClient } from "pg";
import { withTransaction } from "../../db";
import { CreateRoleDto, RoleRecord, UpdateRoleDto } from "./roles.dto";
import { RoleRepository } from "./role.repository";

type RoleRow = {
  id: string;
  nombre: string;
  permissions: Array<{
    id: string;
    recurso: string;
    accion: string;
  }>;
};

type CountRow = {
  total: string;
};

export class PgRoleRepository implements RoleRepository {
  async create(dto: CreateRoleDto): Promise<RoleRecord> {
    return withTransaction(async (client) => {
      const insertSql = `
        insert into rol (nombre)
        values ($1)
        returning id::text as id, nombre;
      `;

      const result = await client.query<{ id: string; nombre: string }>(insertSql, [dto.nombre]);
      const created = result.rows[0];

      if (!created) {
        throw new Error("ROLE_CREATE_FAILED");
      }

      await this.replacePermissions(client, created.id, dto.permissionsIds);

      return this.findByIdOrThrow(client, created.id);
    });
  }

  async findById(id: string): Promise<RoleRecord | null> {
    return withTransaction((client) => this.findByIdInternal(client, id));
  }

  async findByName(name: string): Promise<RoleRecord | null> {
    return withTransaction(async (client) => {
      const sql = `
        select
          r.id::text as id,
          r.nombre,
          coalesce(
            jsonb_agg(
              distinct jsonb_build_object(
                'id', p.id::text,
                'recurso', p.recurso,
                'accion', p.accion
              )
            ) filter (where p.id is not null),
            '[]'::jsonb
          ) as permissions
        from rol r
        left join rolpermiso rp on rp.rol_id = r.id
        left join permiso p on p.id = rp.permiso_id
        where lower(r.nombre) = lower($1)
        group by r.id, r.nombre
        limit 1;
      `;

      const result = await client.query<RoleRow>(sql, [name]);
      const row = result.rows[0];

      return row ? this.mapRole(row) : null;
    });
  }

  async list(): Promise<RoleRecord[]> {
    return withTransaction(async (client) => {
      const sql = `
        select
          r.id::text as id,
          r.nombre,
          coalesce(
            jsonb_agg(
              distinct jsonb_build_object(
                'id', p.id::text,
                'recurso', p.recurso,
                'accion', p.accion
              )
            ) filter (where p.id is not null),
            '[]'::jsonb
          ) as permissions
        from rol r
        left join rolpermiso rp on rp.rol_id = r.id
        left join permiso p on p.id = rp.permiso_id
        group by r.id, r.nombre
        order by r.nombre asc;
      `;

      const result = await client.query<RoleRow>(sql);

      return result.rows.map((row) => this.mapRole(row));
    });
  }

  async update(id: string, dto: UpdateRoleDto): Promise<RoleRecord | null> {
    return withTransaction(async (client) => {
      const existing = await this.findByIdInternal(client, id);

      if (!existing) {
        return null;
      }

      if (dto.nombre !== undefined) {
        await client.query(
          `
            update rol
            set nombre = $1
            where id = $2;
          `,
          [dto.nombre, id]
        );
      }

      if (dto.permissionsIds !== undefined) {
        await this.replacePermissions(client, id, dto.permissionsIds);
      }

      return this.findByIdOrThrow(client, id);
    });
  }

  async delete(id: string): Promise<boolean> {
    return withTransaction(async (client) => {
      const result = await client.query(
        `
          delete from rol
          where id = $1;
        `,
        [id]
      );

      return (result.rowCount ?? 0) > 0;
    });
  }

  async countPermissionsByIds(permissionIds: string[]): Promise<number> {
    if (permissionIds.length === 0) {
      return 0;
    }

    return withTransaction(async (client) => {
      const result = await client.query<CountRow>(
        `
          select count(*)::text as total
          from permiso
          where id = any($1::int[]);
        `,
        [permissionIds.map(Number)]
      );

      return Number(result.rows[0]?.total ?? "0");
    });
  }

  async isAssignedToUsers(id: string): Promise<boolean> {
    return withTransaction(async (client) => {
      const result = await client.query<CountRow>(
        `
          select count(*)::text as total
          from usuariorol
          where rol_id = $1;
        `,
        [id]
      );

      return Number(result.rows[0]?.total ?? "0") > 0;
    });
  }

  private async replacePermissions(
    client: PoolClient,
    roleId: string,
    permissionIds: string[]
  ): Promise<void> {
    await client.query(`delete from rolpermiso where rol_id = $1`, [roleId]);

    if (permissionIds.length === 0) {
      return;
    }

    const normalizedIds = permissionIds.map((id) => Number(id));

    if (normalizedIds.some((id) => !Number.isInteger(id) || id <= 0)) {
      throw new Error("INVALID_PERMISSION_IDS");
    }

    const valuesSql = normalizedIds
      .map((_, index) => `($1, $${index + 2})`)
      .join(", ");

    await client.query(
      `
        insert into rolpermiso (rol_id, permiso_id)
        values ${valuesSql};
      `,
      [roleId, ...normalizedIds]
    );
  }

  private async findByIdInternal(client: PoolClient, id: string): Promise<RoleRecord | null> {
    const sql = `
      select
        r.id::text as id,
        r.nombre,
        coalesce(
          jsonb_agg(
            distinct jsonb_build_object(
              'id', p.id::text,
              'recurso', p.recurso,
              'accion', p.accion
            )
          ) filter (where p.id is not null),
          '[]'::jsonb
        ) as permissions
      from rol r
      left join rolpermiso rp on rp.rol_id = r.id
      left join permiso p on p.id = rp.permiso_id
      where r.id = $1
      group by r.id, r.nombre
      limit 1;
    `;

    const result = await client.query<RoleRow>(sql, [id]);
    const row = result.rows[0];

    return row ? this.mapRole(row) : null;
  }

  private async findByIdOrThrow(client: PoolClient, id: string): Promise<RoleRecord> {
    const role = await this.findByIdInternal(client, id);

    if (!role) {
      throw new Error("ROLE_NOT_FOUND_AFTER_WRITE");
    }

    return role;
  }

  private mapRole(row: RoleRow): RoleRecord {
    return {
      id: row.id,
      nombre: row.nombre,
      permissions: Array.isArray(row.permissions) ? row.permissions : [],
    };
  }
}