// modules/roles/roles.postgres-repository.ts

import { PoolClient } from "pg";
import { query, withTransaction } from "../../db";
import { CreateRoleDto, RoleRecord, UpdateRoleDto } from "./roles.dto";
import { RoleRepository } from "./roles.repository";

// ── Tipos internos ───────────────────────────────────────

type RoleRow = {
  id: string;
  nombre: string;
  permissions: Array<{ id: string; recurso: string; accion: string }>;
};

type CountRow = { total: string };

// ── Constantes SQL ───────────────────────────────────────

const ROLE_SELECT = `
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
`;

const ROLE_GROUP_BY = `group by r.id, r.nombre`;

// ── Repositorio ──────────────────────────────────────────

export class PgRoleRepository implements RoleRepository {
  async create(dto: CreateRoleDto): Promise<RoleRecord> {
    return withTransaction(async (client) => {
      const { rows } = await client.query<{ id: string }>(
        `insert into rol (nombre) values ($1) returning id::text as id`,
        [dto.nombre]
      );

      const created = rows[0];
      if (!created) throw new Error("ROLE_CREATE_FAILED");

      await this.replacePermissions(client, created.id, dto.permissionsIds);

      return this.findByIdOrThrow(client, created.id);
    });
  }

  async findById(id: string): Promise<RoleRecord | null> {
    const { rows } = await query<RoleRow>(
      `${ROLE_SELECT} where r.id = $1 ${ROLE_GROUP_BY} limit 1`,
      [id]
    );

    return rows[0] ? this.toRecord(rows[0]) : null;
  }

  async findByName(name: string): Promise<RoleRecord | null> {
    const { rows } = await query<RoleRow>(
      `${ROLE_SELECT} where lower(r.nombre) = lower($1) ${ROLE_GROUP_BY} limit 1`,
      [name]
    );

    return rows[0] ? this.toRecord(rows[0]) : null;
  }

  async list(): Promise<RoleRecord[]> {
    const { rows } = await query<RoleRow>(
      `${ROLE_SELECT} ${ROLE_GROUP_BY} order by r.nombre asc`
    );

    return rows.map((row) => this.toRecord(row));
  }

  async update(id: string, dto: UpdateRoleDto): Promise<RoleRecord | null> {
    return withTransaction(async (client) => {
      const existing = await this.findByIdInternal(client, id);
      if (!existing) return null;

      if (dto.nombre !== undefined) {
        await client.query(`update rol set nombre = $1 where id = $2`, [
          dto.nombre,
          id,
        ]);
      }

      if (dto.permissionsIds !== undefined) {
        await this.replacePermissions(client, id, dto.permissionsIds);
      }

      return this.findByIdOrThrow(client, id);
    });
  }

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await query(`delete from rol where id = $1`, [id]);

    return (rowCount ?? 0) > 0;
  }

  async countPermissionsByIds(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;

    const { rows } = await query<CountRow>(
      `select count(*)::text as total from permiso where id = any($1::int[])`,
      [ids.map(Number)]
    );

    return Number(rows[0]?.total ?? "0");
  }

  async isAssignedToUsers(roleId: string): Promise<boolean> {
    const { rows } = await query<CountRow>(
      `select count(*)::text as total from usuariorol where rol_id = $1`,
      [roleId]
    );

    return Number(rows[0]?.total ?? "0") > 0;
  }

  // ── Privados ──────────────────────────────────────────

  private async replacePermissions(
    client: PoolClient,
    roleId: string,
    permissionIds: string[]
  ): Promise<void> {
    await client.query(`delete from rolpermiso where rol_id = $1`, [roleId]);

    if (permissionIds.length === 0) return;

    const normalized = permissionIds.map(Number);

    if (normalized.some((n) => !Number.isInteger(n) || n <= 0)) {
      throw new Error("INVALID_PERMISSION_IDS");
    }

    const values = normalized
      .map((_, i) => `($1, $${i + 2})`)
      .join(", ");

    await client.query(
      `insert into rolpermiso (rol_id, permiso_id) values ${values}`,
      [roleId, ...normalized]
    );
  }

  private async findByIdInternal(
    client: PoolClient,
    id: string
  ): Promise<RoleRecord | null> {
    const { rows } = await client.query<RoleRow>(
      `${ROLE_SELECT} where r.id = $1 ${ROLE_GROUP_BY} limit 1`,
      [id]
    );

    return rows[0] ? this.toRecord(rows[0]) : null;
  }

  private async findByIdOrThrow(
    client: PoolClient,
    id: string
  ): Promise<RoleRecord> {
    const role = await this.findByIdInternal(client, id);

    if (!role) throw new Error("ROLE_NOT_FOUND_AFTER_WRITE");

    return role;
  }

  private toRecord(row: RoleRow): RoleRecord {
    return {
      id: row.id,
      nombre: row.nombre,
      permissions: Array.isArray(row.permissions) ? row.permissions : [],
    };
  }
}
