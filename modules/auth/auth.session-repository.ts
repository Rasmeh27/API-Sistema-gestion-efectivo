// modules/auth/auth.session-repository.ts

export type SessionStatus = "ACTIVA" | "REVOCADA" | "EXPIRADA";

export interface AuthSessionRecord {
  id: string;
  usuarioId: string;
  refreshToken: string;
  creadoEn: Date;
  expiraEn: Date;
  revocadoEn: Date | null;
  ipCreacion: string | null;
  ipRevocacion: string | null;
  userAgent: string | null;
  estado: SessionStatus;
}

export interface CreateSessionParams {
  usuarioId: string;
  refreshToken: string;
  expiraEn: Date;
  ipCreacion: string | null;
  userAgent: string | null;
}

export interface AuthSessionRepository {
  create(params: CreateSessionParams): Promise<AuthSessionRecord>;
  findByRefreshToken(token: string): Promise<AuthSessionRecord | null>;
  revoke(id: string, ipRevocacion: string | null): Promise<boolean>;
  revokeAllByUsuario(usuarioId: string): Promise<number>;
  deleteExpired(): Promise<number>;
}
