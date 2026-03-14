import { PoolClient } from "pg";
import { withTransaction } from "../../db";
import { CreateUserDto, UpdateUserDto, UserRecord, UserStatus } from "./users.dto";
import { UserRepository } from "./users.repository";

type UserRow = {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  role_ids: string[] | null;
};

type CountRow = {
  total: string;
};

export class PgUserRepository implements UserRepository {
  async create(user: CreateUserDto & { status: UserStatus }): Promise<UserRecord> {
    return withTransaction(async (client) => {
      const insertUserSql = `
        insert into usuario ("username_email", nombre, estado)
        values ($1, $2, $3)
        returning
          id::text as id,
          nombre as name,
          "username_email" as email,
          estado as status;
      `;

      const inserted = await client.query<Omit<UserRow, "role_ids">>(insertUserSql, [
        user.email,
        user.name,
        user.status,
      ]);

      const created = inserted.rows[0];

      if (!created) {
        throw new Error("USER_CREATE_FAILED");
      }

      await this.replaceRoles(client, created.id, user.roleIds ?? []);

      return this.findByIdOrThrow(client, created.id);
    });
  }

  async findById(id: string): Promise<UserRecord | null> {
    return withTransaction(async (client) => {
      return this.findByIdInternal(client, id);
    });
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    return withTransaction(async (client) => {
      const sql = `
        select
          u.id::text as id,
          u.nombre as name,
          u."username_email" as email,
          u.estado as status,
          coalesce(
            array_agg(distinct ur.rol_id::text) filter (where ur.rol_id is not null),
            '{}'::text[]
          ) as role_ids
        from usuario u
        left join usuariorol ur
          on ur.usuario_id = u.id
        where lower(u."username_email") = lower($1)
        group by u.id, u.nombre, u."username_email", u.estado
        limit 1;
      `;

      const result = await client.query<UserRow>(sql, [email]);
      const row = result.rows[0];

      return row ? this.mapUser(row) : null;
    });
  }

  async update(id: string, patch: UpdateUserDto): Promise<UserRecord | null> {
    return withTransaction(async (client) => {
      const existing = await this.findByIdInternal(client, id);

      if (!existing) {
        return null;
      }

      const sets: string[] = [];
      const values: unknown[] = [];
      let index = 1;

      if (patch.name !== undefined) {
        sets.push(`nombre = $${index++}`);
        values.push(patch.name);
      }

      if (patch.email !== undefined) {
        sets.push(`"username_email" = $${index++}`);
        values.push(patch.email);
      }

      if (patch.status !== undefined) {
        sets.push(`estado = $${index++}`);
        values.push(patch.status);
      }

      if (sets.length > 0) {
        values.push(id);

        const sql = `
          update usuario
          set ${sets.join(", ")}
          where id = $${index};
        `;

        await client.query(sql, values);
      }

      if (patch.roleIds !== undefined) {
        await this.replaceRoles(client, id, patch.roleIds);
      }

      return this.findByIdOrThrow(client, id);
    });
  }

  async list(
    offset: number,
    limit: number,
    status?: UserStatus,
    roleIds?: string[]
  ): Promise<{ items: UserRecord[]; total: number }> {
    return withTransaction(async (client) => {
      const filters: string[] = [];
      const values: unknown[] = [];
      let index = 1;

      if (status) {
        filters.push(`u.estado = $${index++}`);
        values.push(status);
      }

      if (roleIds && roleIds.length > 0) {
        filters.push(`
          exists (
            select 1
            from usuariorol ur_filter
            where ur_filter.usuario_id = u.id
              and ur_filter.rol_id = any($${index++}::int[])
          )
        `);
        values.push(roleIds.map((roleId) => Number(roleId)));
      }

      const whereClause = filters.length > 0 ? `where ${filters.join(" and ")}` : "";

      const listSql = `
        select
          u.id::text as id,
          u.nombre as name,
          u."username_email" as email,
          u.estado as status,
          coalesce(
            array_agg(distinct ur.rol_id::text) filter (where ur.rol_id is not null),
            '{}'::text[]
          ) as role_ids
        from usuario u
        left join usuariorol ur
          on ur.usuario_id = u.id
        ${whereClause}
        group by u.id, u.nombre, u."username_email", u.estado
        order by u.id desc
        offset $${index++}
        limit $${index++};
      `;

      const countSql = `
        select count(*)::text as total
        from usuario u
        ${whereClause};
      `;

      const listValues = [...values, offset, limit];
      const [itemsResult, countResult] = await Promise.all([
        client.query<UserRow>(listSql, listValues),
        client.query<CountRow>(countSql, values),
      ]);

      return {
        items: itemsResult.rows.map((row) => this.mapUser(row)),
        total: Number(countResult.rows[0]?.total ?? "0"),
      };
    });
  }

  async deactivate(id: string): Promise<UserRecord | null> {
    return this.updateStatus(id, "INACTIVO");
  }

  async updateStatus(id: string, status: UserStatus): Promise<UserRecord | null> {
    return withTransaction(async (client) => {
      const sql = `
        update usuario
        set estado = $1
        where id = $2
        returning id::text as id;
      `;

      const result = await client.query<{ id: string }>(sql, [status, id]);

      if (!result.rows[0]) {
        return null;
      }

      return this.findByIdOrThrow(client, id);
    });
  }

  private async findByIdInternal(client: PoolClient, id: string): Promise<UserRecord | null> {
    const sql = `
      select
        u.id::text as id,
        u.nombre as name,
        u."username_email" as email,
        u.estado as status,
        coalesce(
          array_agg(distinct ur.rol_id::text) filter (where ur.rol_id is not null),
          '{}'::text[]
        ) as role_ids
      from usuario u
      left join usuariorol ur
        on ur.usuario_id = u.id
      where u.id = $1
      group by u.id, u.nombre, u."username_email", u.estado
      limit 1;
    `;

    const result = await client.query<UserRow>(sql, [id]);
    const row = result.rows[0];

    return row ? this.mapUser(row) : null;
  }

  private async findByIdOrThrow(client: PoolClient, id: string): Promise<UserRecord> {
    const record = await this.findByIdInternal(client, id);

    if (!record) {
      throw new Error("USER_NOT_FOUND_AFTER_WRITE");
    }

    return record;
  }

  private async replaceRoles(client: PoolClient, userId: string, roleIds: string[]): Promise<void> {
    await client.query("delete from usuariorol where usuario_id = $1", [userId]);

    if (roleIds.length === 0) {
      return;
    }

    const normalizedRoleIds = roleIds.map((roleId) => Number(roleId));

    if (normalizedRoleIds.some((roleId) => !Number.isInteger(roleId) || roleId <= 0)) {
      throw new Error("INVALID_ROLE_IDS");
    }

    const valuesSql = normalizedRoleIds
      .map((_, index) => `($1, $${index + 2})`)
      .join(", ");

    const sql = `
      insert into usuariorol (usuario_id, rol_id)
      values ${valuesSql};
    `;

    await client.query(sql, [userId, ...normalizedRoleIds]);
  }

  private mapUser(row: UserRow): UserRecord {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      status: row.status,
      roleIds: row.role_ids ?? [],
    };
  }
}