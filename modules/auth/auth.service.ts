// modules/auth/auth.service.ts

import { AuthUserRepository } from "./auth.repository";
import { PasswordService } from "./auth.password-service";
import { JwtTokenService } from "./auth.token-service";
import { AuthSessionRepository } from "./auth.session-repository";
import { AuthErrors } from "./auth.errors";
import {
  LoginRequestDto,
  LoginResponseDto,
  RefreshRequestDto,
  RefreshResponseDto,
} from "./auth.dto";
import { AuditLogger } from "../audit/audit.logger";

// ── Request metadata ────────────────────────────────────

export interface RequestMeta {
  ip: string | null;
  userAgent: string | null;
}

// ── Servicio ────────────────────────────────────────────

export class AuthService {
  constructor(
    private readonly users: AuthUserRepository,
    private readonly passwords: PasswordService,
    private readonly tokens: JwtTokenService,
    private readonly sessions: AuthSessionRepository,
    private readonly audit: AuditLogger
  ) {}

  // ── Login ───────────────────────────────────────────

  async login(
    dto: LoginRequestDto,
    meta: RequestMeta
  ): Promise<LoginResponseDto> {
    const user = await this.findActiveUser(dto.email);

    await this.verifyPassword(dto.password, user.passwordHash);

    const result = await this.createSessionTokens(
      user.id, user.email, user.roles, user.permissions, meta
    );

    await this.audit.log({
      usuarioId: user.id,
      accion: "LOGIN",
      entidadTipo: "SESION",
      entidadId: user.id,
      resumen: `Inicio de sesión desde ${meta.ip ?? "IP desconocida"}`,
      metadata: JSON.stringify({ ip: meta.ip, userAgent: meta.userAgent }),
    });

    return result;
  }

  // ── Refresh ─────────────────────────────────────────

  async refresh(
    dto: RefreshRequestDto,
    meta: RequestMeta
  ): Promise<RefreshResponseDto> {
    const session = await this.sessions.findByRefreshToken(dto.refreshToken);

    if (!session) {
      throw AuthErrors.sessionNotFound();
    }

    if (session.estado === "REVOCADA") {
      await this.sessions.revokeAllByUsuario(session.usuarioId);
      throw AuthErrors.sessionRevoked();
    }

    if (session.estado === "EXPIRADA" || session.expiraEn < new Date()) {
      throw AuthErrors.sessionExpired();
    }

    await this.sessions.revoke(session.id, meta.ip);

    const userById = await this.findActiveUserById(session.usuarioId);

    return this.createSessionTokens(
      userById.id,
      userById.email,
      userById.roles,
      userById.permissions,
      meta
    );
  }

  // ── Logout ──────────────────────────────────────────

  async logout(
    refreshToken: string,
    meta: RequestMeta,
    userId?: string
  ): Promise<void> {
    const session = await this.sessions.findByRefreshToken(refreshToken);

    if (!session) {
      return; // Idempotente
    }

    await this.sessions.revoke(session.id, meta.ip);

    await this.audit.log({
      usuarioId: userId ?? session.usuarioId,
      accion: "LOGOUT",
      entidadTipo: "SESION",
      entidadId: session.id,
      resumen: "Cierre de sesión",
    });
  }

  // ── Logout global ─────────────────────────────────

  async logoutAll(usuarioId: string): Promise<number> {
    const count = await this.sessions.revokeAllByUsuario(usuarioId);

    await this.audit.log({
      usuarioId,
      accion: "LOGOUT_ALL",
      entidadTipo: "SESION",
      entidadId: usuarioId,
      resumen: `Cierre de todas las sesiones (${count} revocadas)`,
    });

    return count;
  }

  // ── Métodos privados ────────────────────────────────

  private async findActiveUser(email: string) {
    const user = await this.users.findByEmail(email);

    if (!user) {
      throw AuthErrors.invalidCredentials();
    }

    if (user.status === "BLOQUEADO") {
      throw AuthErrors.userBlocked();
    }

    if (user.status !== "ACTIVO") {
      throw AuthErrors.invalidCredentials();
    }

    return user;
  }

  private async findActiveUserById(id: string) {
    const user = await this.users.findById(id);

    if (!user) {
      throw AuthErrors.invalidCredentials();
    }

    if (user.status === "BLOQUEADO") {
      throw AuthErrors.userBlocked();
    }

    return user;
  }

  private async verifyPassword(
    plain: string,
    hash: string
  ): Promise<void> {
    if (!hash) {
      throw AuthErrors.invalidCredentials();
    }

    const isValid = await this.passwords.compare(plain, hash);

    if (!isValid) {
      throw AuthErrors.invalidCredentials();
    }
  }

  private async createSessionTokens(
    userId: string,
    email: string,
    roles: string[],
    permissions: string[],
    meta: RequestMeta
  ): Promise<LoginResponseDto> {
    const accessToken = this.tokens.signAccessToken({
      sub: userId,
      email,
      roles,
      permissions,
    });

    const refreshToken = this.tokens.generateRefreshToken();
    const expiraEn = this.tokens.getRefreshExpirationDate();

    await this.sessions.create({
      usuarioId: userId,
      refreshToken,
      expiraEn,
      ipCreacion: meta.ip,
      userAgent: meta.userAgent,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.tokens.getAccessTokenTtlSeconds(),
    };
  }
}
