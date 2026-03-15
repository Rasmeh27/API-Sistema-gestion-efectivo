// modules/auth/auth.service.ts

import { AuthUserRepository } from "./auth.repository";
import { PasswordService } from "./auth.password-service";
import { TokenService } from "./auth.token-service";
import { JwtTokenService } from "./auth.token-service";
import { AuthSessionRepository } from "./auth.session-repository";
import { AuthErrors } from "./auth.errors";
import {
  LoginRequestDto,
  LoginResponseDto,
  RefreshRequestDto,
  RefreshResponseDto,
} from "./auth.dto";

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
    private readonly sessions: AuthSessionRepository
  ) {}

  // ── Login ───────────────────────────────────────────

  async login(
    dto: LoginRequestDto,
    meta: RequestMeta
  ): Promise<LoginResponseDto> {
    const user = await this.findActiveUser(dto.email);

    await this.verifyPassword(dto.password, user.passwordHash);

    return this.createSessionTokens(user.id, user.email, user.roles, user.permissions, meta);
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

  async logout(refreshToken: string, meta: RequestMeta): Promise<void> {
    const session = await this.sessions.findByRefreshToken(refreshToken);

    if (!session) {
      return; // Idempotente: no falla si ya no existe
    }

    await this.sessions.revoke(session.id, meta.ip);
  }

  // ── Logout global (todas las sesiones) ──────────────

  async logoutAll(usuarioId: string): Promise<number> {
    return this.sessions.revokeAllByUsuario(usuarioId);
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
    // Se necesita agregar findById al AuthUserRepository
    // Por ahora delegamos al repositorio existente
    const user = await (this.users as any).findById?.(id);

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
