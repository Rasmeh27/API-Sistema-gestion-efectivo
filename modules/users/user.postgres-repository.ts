// modules/users/users.postgres-repository.ts

import { PoolClient } from "pg";
import { query, withTransaction } from "../../db";
import {
  CreateUserDto,
  UpdateUserDto,
  UserRecord,
  UserStatus,
} from "./users.dto";
import { UserRepository } from "./users.repository";

// ── Row types ───────────────────────────────────────────

interface UserRow {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  role_ids: string[] | null;
  sucursal_default_id: string | null;
}

interface CountRow {
  total: string;
}

// ── Queries base ────────────────────────────────────────

const USER_SELECT = `
  SELECT
    u.id::text           AS id,
    u.nombre             AS name,
    u.username_email     AS email,
    u.estado             AS status,
    u.sucursal_default_id::text AS sucursal_default_id,
    COALESCE(
      array_agg(DISTINCT ur.rol_id::text)
        FILTER (WHERE ur.rol_id IS NOT NULL),
      '{}'::text[]
    ) AS role_ids
  FROM usuario u
  LEFT JOIN usuariorol ur ON ur.usuario_id = u.id
`;

const USER_GROUP_BY = `
  GROUP BY u.id, u.nombre, u.username_email, u.estado, u.sucursal_default_id
`;

// ── Implementación ──────────────────────────────────────

export class PgUserRepository implements UserRepository {
  async create(
    user: CreateUserDto & { status: UserStatus; passwordHash: string }
  ): Promise<UserRecord> {
    return withTransaction(async (client) => {
      const sql = `
        INSERT INTO usuario (username_email, nombre, estado, password_hash, sucursal_default_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id::text AS id;
      `;

      const result = await client.query<{ id: string }>(sql, [
        user.email,
        user.name,
        user.status,
        user.passwordHash,
        user.sucursalDefaultId ?? null,
      ]);

      const row = result.rows[0];

      if (!row) {
        throw new Error("USER_CREATE_FAILED");
      }

      await this.replaceRoles(client, row.id, user.roleIds ?? []);

      return this.findByIdOrFail(client, row.id);
    });
  }

  async findById(id: string): Promise<UserRecord | null> {
    const sql = `
      ${USER_SELECT}
      WHERE u.id = $1
      ${USER_GROUP_BY}
      LIMIT 1;
    `;

    const result = await query<UserRow>(sql, [id]);
    return result.rows[0] ? this.toRecord(result.rows[0]) : null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const sql = `
      ${USER_SELECT}
      WHERE lower(u.username_email) = lower($1)
      ${USER_GROUP_BY}
      LIMIT 1;
    `;

    const result = await query<UserRow>(sql, [email]);
    return result.rows[0] ? this.toRecord(result.rows[0]) : null;
  }

  async update(
    id: string,
    patch: UpdateUserDto
  ): Promise<UserRecord | null> {
    return withTransaction(async (client) => {
      const existing = await this.findByIdWithClient(client, id);

      if (!existing) return null;

      await this.applyScalarUpdates(client, id, patch);

      if (patch.roleIds !== undefined) {
        await this.replaceRoles(client, id, patch.roleIds);
      }

      return this.findByIdOrFail(client, id);
    });
  }

  async list(
    offset: number,
    limit: number,
    status?: UserStatus,
    roleIds?: string[]
  ): Promise<{ items: UserRecord[]; total: number }> {
    const { whereClause, values } = this.buildFilters(status, roleIds);
    let paramIndex = values.length + 1;

    const listSql = `
      ${USER_SELECT}
      ${whereClause}
      ${USER_GROUP_BY}
      ORDER BY u.id DESC
      OFFSET $${paramIndex++}
      LIMIT $${paramIndex};
    `;

    const countSql = `
      SELECT COUNT(*)::text AS total
      FROM usuario u
      ${whereClause};
    `;

    const listValues = [...values, offset, limit];

    const [itemsResult, countResult] = await Promise.all([
      query<UserRow>(listSql, listValues),
      query<CountRow>(countSql, values),
    ]);

    return {
      items: itemsResult.rows.map((row) => this.toRecord(row)),
      total: Number(countResult.rows[0]?.total ?? "0"),
    };
  }

  async updateStatus(
    id: string,
    status: UserStatus
  ): Promise<UserRecord | null> {
    const sql = `
      UPDATE usuario SET estado = $1 WHERE id = $2
      RETURNING id::text AS id;
    `;

    const result = await query<{ id: string }>(sql, [status, id]);

    if (!result.rows[0]) return null;

    return this.findById(id);
  }

  // ── Métodos privados ────────────────────────────────

  private async findByIdWithClient(
    client: PoolClient,
    id: string
  ): Promise<UserRecord | null> {
    const sql = `
      ${USER_SELECT}
      WHERE u.id = $1
      ${USER_GROUP_BY}
      LIMIT 1;
    `;

    const result = await client.query<UserRow>(sql, [id]);
    return result.rows[0] ? this.toRecord(result.rows[0]) : null;
  }

  private async findByIdOrFail(
    client: PoolClient,
    id: string
  ): Promise<UserRecord> {
    const record = await this.findByIdWithClient(client, id);

    if (!record) {
      throw new Error("USER_NOT_FOUND_AFTER_WRITE");
    }

    return record;
  }

  private async applyScalarUpdates(
    client: PoolClient,
    id: string,
    patch: UpdateUserDto
  ): Promise<void> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    if (patch.name !== undefined) {
      sets.push(`nombre = $${index++}`);
      values.push(patch.name);
    }

    if (patch.email !== undefined) {
      sets.push(`username_email = $${index++}`);
      values.push(patch.email);
    }

    if (patch.status !== undefined) {
      sets.push(`estado = $${index++}`);
      values.push(patch.status);
    }

    if (patch.sucursalDefaultId !== undefined) {
      sets.push(`sucursal_default_id = $${index++}`);
      values.push(patch.sucursalDefaultId);
    }

    if (sets.length === 0) return;

    values.push(id);
    const sql = `
      UPDATE usuario SET ${sets.join(", ")} WHERE id = $${index};
    `;

    await client.query(sql, values);
  }

  private async replaceRoles(
    client: PoolClient,
    userId: string,
    roleIds: string[]
  ): Promise<void> {
    await client.query(
      "DELETE FROM usuariorol WHERE usuario_id = $1",
      [userId]
    );

    if (roleIds.length === 0) return;

    const numericIds = roleIds.map((id) => {
      const num = Number(id);
      if (!Number.isInteger(num) || num <= 0) {
        throw new Error("INVALID_ROLE_IDS");
      }
      return num;
    });

    const valuesClauses = numericIds
      .map((_, i) => `($1, $${i + 2})`)
      .join(", ");

    await client.query(
      `INSERT INTO usuariorol (usuario_id, rol_id) VALUES ${valuesClauses}`,
      [userId, ...numericIds]
    );
  }

  private buildFilters(
    status?: UserStatus,
    roleIds?: string[]
  ): { whereClause: string; values: unknown[] } {
    const filters: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    if (status) {
      filters.push(`u.estado = $${index++}`);
      values.push(status);
    }

    if (roleIds && roleIds.length > 0) {
      filters.push(`
        EXISTS (
          SELECT 1 FROM usuariorol ur_f
          WHERE ur_f.usuario_id = u.id
            AND ur_f.rol_id = ANY($${index++}::int[])
        )
      `);
      values.push(roleIds.map(Number));
    }

    const whereClause =
      filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

    return { whereClause, values };
  }

  private toRecord(row: UserRow): UserRecord {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      status: row.status,
      sucursalDefaultId: row.sucursal_default_id,
      roleIds: row.role_ids ?? [],
    };
  }
}
