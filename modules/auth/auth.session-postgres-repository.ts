// modules/auth/auth.session-postgres-repository.ts

import { query, withTransaction } from "../../db";
import {
  AuthSessionRecord,
  AuthSessionRepository,
  CreateSessionParams,
  SessionStatus,
} from "./auth.session-repository";

interface SessionRow {
  id: string;
  usuario_id: string;
  refresh_token: string;
  creado_en: Date;
  expira_en: Date;
  revocado_en: Date | null;
  ip_creacion: string | null;
  ip_revocacion: string | null;
  user_agent: string | null;
  estado: SessionStatus;
}

const SESSION_SELECT = `
  select
    id::text as id, usuario_id, refresh_token, creado_en, expira_en,
    revocado_en, ip_creacion, ip_revocacion, user_agent, estado
  from sesionusuario
`;

export class PgAuthSessionRepository implements AuthSessionRepository {
  async create(params: CreateSessionParams): Promise<AuthSessionRecord> {
    return withTransaction(async (client) => {
      const sql = `
        insert into sesionusuario
          (usuario_id, refresh_token, creado_en, expira_en, ip_creacion, user_agent, estado)
        values
          ($1, $2, now(), $3, $4, $5, 'ACTIVA')
        returning
          id::text as id, usuario_id, refresh_token, creado_en, expira_en,
          revocado_en, ip_creacion, ip_revocacion, user_agent, estado
      `;

      const result = await client.query<SessionRow>(sql, [
        params.usuarioId,
        params.refreshToken,
        params.expiraEn,
        params.ipCreacion,
        params.userAgent,
      ]);

      return this.toRecord(result.rows[0]);
    });
  }

  async findByRefreshToken(
    token: string
  ): Promise<AuthSessionRecord | null> {
    const result = await query<SessionRow>(
      `${SESSION_SELECT} where refresh_token = $1 limit 1`,
      [token]
    );

    const row = result.rows[0];
    return row ? this.toRecord(row) : null;
  }

  async revoke(
    id: string,
    ipRevocacion: string | null
  ): Promise<boolean> {
    const result = await query(
      `update sesionusuario
       set estado = 'REVOCADA', revocado_en = now(), ip_revocacion = $2
       where id = $1 and estado = 'ACTIVA'`,
      [id, ipRevocacion]
    );

    return (result.rowCount ?? 0) > 0;
  }

  async revokeAllByUsuario(usuarioId: string): Promise<number> {
    const result = await query(
      `update sesionusuario
       set estado = 'REVOCADA', revocado_en = now()
       where usuario_id = $1 and estado = 'ACTIVA'`,
      [usuarioId]
    );

    return result.rowCount ?? 0;
  }

  async deleteExpired(): Promise<number> {
    const result = await query(
      `delete from sesionusuario
       where estado = 'EXPIRADA'
         or (estado = 'ACTIVA' and expira_en < now())`
    );

    return result.rowCount ?? 0;
  }

  private toRecord(row: SessionRow): AuthSessionRecord {
    return {
      id: row.id,
      usuarioId: row.usuario_id,
      refreshToken: row.refresh_token,
      creadoEn: row.creado_en,
      expiraEn: row.expira_en,
      revocadoEn: row.revocado_en,
      ipCreacion: row.ip_creacion,
      ipRevocacion: row.ip_revocacion,
      userAgent: row.user_agent,
      estado: row.estado,
    };
  }
}
