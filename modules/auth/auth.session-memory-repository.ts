// modules/auth/auth.session-memory-repository.ts

import {
  AuthSessionRecord,
  AuthSessionRepository,
  CreateSessionParams,
} from "./auth.session-repository";

export class InMemoryAuthSessionRepository implements AuthSessionRepository {
  private sessions: AuthSessionRecord[] = [];
  private nextId = 1;

  async create(params: CreateSessionParams): Promise<AuthSessionRecord> {
    const session: AuthSessionRecord = {
      id: String(this.nextId++),
      usuarioId: params.usuarioId,
      refreshToken: params.refreshToken,
      creadoEn: new Date(),
      expiraEn: params.expiraEn,
      revocadoEn: null,
      ipCreacion: params.ipCreacion,
      ipRevocacion: null,
      userAgent: params.userAgent,
      estado: "ACTIVA",
    };

    this.sessions.push(session);
    return session;
  }

  async findByRefreshToken(
    token: string
  ): Promise<AuthSessionRecord | null> {
    return this.sessions.find((s) => s.refreshToken === token) ?? null;
  }

  async revoke(
    id: string,
    ipRevocacion: string | null
  ): Promise<boolean> {
    const session = this.sessions.find(
      (s) => s.id === id && s.estado === "ACTIVA"
    );

    if (!session) return false;

    session.estado = "REVOCADA";
    session.revocadoEn = new Date();
    session.ipRevocacion = ipRevocacion;
    return true;
  }

  async revokeAllByUsuario(usuarioId: string): Promise<number> {
    let count = 0;

    for (const session of this.sessions) {
      if (session.usuarioId === usuarioId && session.estado === "ACTIVA") {
        session.estado = "REVOCADA";
        session.revocadoEn = new Date();
        count++;
      }
    }

    return count;
  }

  async deleteExpired(): Promise<number> {
    const now = new Date();
    const before = this.sessions.length;

    this.sessions = this.sessions.filter(
      (s) => s.estado !== "EXPIRADA" && !(s.estado === "ACTIVA" && s.expiraEn < now)
    );

    return before - this.sessions.length;
  }
}
