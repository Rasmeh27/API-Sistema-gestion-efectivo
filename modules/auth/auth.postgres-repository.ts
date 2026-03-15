// modules/auth/auth.postgres-repository.ts

import { query } from "../../db";
import { AuthUserRecord, AuthUserRepository } from "./auth.repository";

interface AuthUserRow {
  id: string;
  email: string;
  password_hash: string | null;
  roles: string[] | null;
  permissions: string[] | null;
  status: AuthUserRecord["status"];
}

const BASE_QUERY = `
  SELECT
    u.id::text       AS id,
    u.username_email  AS email,
    u.password_hash,
    COALESCE(
      array_agg(DISTINCT r.nombre) FILTER (WHERE r.nombre IS NOT NULL),
      '{}'::text[]
    ) AS roles,
    COALESCE(
      array_agg(DISTINCT upper(p.recurso || ':' || p.accion))
        FILTER (WHERE p.id IS NOT NULL),
      '{}'::text[]
    ) AS permissions,
    u.estado AS status
  FROM usuario u
  LEFT JOIN usuariorol ur ON ur.usuario_id = u.id
  LEFT JOIN rol r          ON r.id = ur.rol_id
  LEFT JOIN rolpermiso rp  ON rp.rol_id = r.id
  LEFT JOIN permiso p      ON p.id = rp.permiso_id
`;

const GROUP_BY = `
  GROUP BY u.id, u.username_email, u.password_hash, u.estado
`;

export class PgAuthUserRepository implements AuthUserRepository {
  async findByEmail(email: string): Promise<AuthUserRecord | null> {
    const sql = `
      ${BASE_QUERY}
      WHERE lower(u.username_email) = lower($1)
      ${GROUP_BY}
      LIMIT 1;
    `;

    return this.findOne(sql, [email]);
  }

  async findById(id: string): Promise<AuthUserRecord | null> {
    const sql = `
      ${BASE_QUERY}
      WHERE u.id = $1
      ${GROUP_BY}
      LIMIT 1;
    `;

    return this.findOne(sql, [id]);
  }

  private async findOne(
    sql: string,
    params: unknown[]
  ): Promise<AuthUserRecord | null> {
    const result = await query<AuthUserRow>(sql, params);
    const row = result.rows[0];

    return row ? this.toRecord(row) : null;
  }

  private toRecord(row: AuthUserRow): AuthUserRecord {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash ?? "",
      roles: row.roles ?? [],
      permissions: row.permissions ?? [],
      status: row.status,
    };
  }
}
