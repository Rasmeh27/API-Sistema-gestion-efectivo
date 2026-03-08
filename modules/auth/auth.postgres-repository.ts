import { query } from "../../db";
import { AuthUserRecord, AuthUserRepository } from "./auth.repository";

type AuthUserRow = {
  id: string;
  email: string;
  password_hash: string | null;
  roles: string[] | null;
  permissions: string[] | null;
  status: AuthUserRecord["status"];
};

export class PgAuthUserRepository implements AuthUserRepository {
  async findByEmail(email: string): Promise<AuthUserRecord | null> {
    const sql = `
      select
        u.id::text as id,
        u.username_email as email,
        u.password_hash,
        coalesce(
          array_agg(distinct r.nombre) filter (where r.nombre is not null),
          '{}'::text[]
        ) as roles,
        coalesce(
          array_agg(distinct upper(p.recurso || ':' || p.accion)) filter (where p.id is not null),
          '{}'::text[]
        ) as permissions,
        u.estado as status
      from usuario u
      left join usuariorol ur
        on ur.usuario_id = u.id
      left join rol r
        on r.id = ur.rol_id
      left join rolpermiso rp
        on rp.rol_id = r.id
      left join permiso p
        on p.id = rp.permiso_id
      where lower(u.username_email) = lower($1)
      group by
        u.id,
        u.username_email,
        u.password_hash,
        u.estado
      limit 1;
    `;

    const result = await query<AuthUserRow>(sql, [email]);
    const row = result.rows[0];

    if (!row) {
      return null;
    }

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