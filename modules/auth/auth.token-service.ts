// modules/auth/auth.token-service.ts

import jwt, { Secret, SignOptions } from "jsonwebtoken";
import crypto from "crypto";

// ── Tipos ───────────────────────────────────────────────

export interface AccessTokenPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface DecodedAccessToken extends AccessTokenPayload {
  iat: number;
  exp: number;
}

// ── Interfaz ────────────────────────────────────────────

export interface TokenService {
  signAccessToken(payload: AccessTokenPayload): string;
  verifyAccessToken(token: string): DecodedAccessToken;
  generateRefreshToken(): string;
  getAccessTokenTtlSeconds(): number;
}

// ── Configuración ───────────────────────────────────────

export interface TokenServiceConfig {
  secret: string;
  accessExpiresIn: string | number;
  refreshExpiresInDays: number;
}

// ── Implementación ──────────────────────────────────────

const REFRESH_TOKEN_BYTES = 48;

export class JwtTokenService implements TokenService {
  private readonly secret: Secret;
  private readonly accessExpiresIn: string | number;
  private readonly accessTtlSeconds: number;
  private readonly refreshExpiresInDays: number;

  constructor(config: TokenServiceConfig) {
    if (!config.secret?.trim()) {
      throw new Error("JWT secret es requerido");
    }

    this.secret = config.secret;
    this.accessExpiresIn = config.accessExpiresIn;
    this.accessTtlSeconds = this.parseExpiresInToSeconds(config.accessExpiresIn);
    this.refreshExpiresInDays = config.refreshExpiresInDays;
  }

  signAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(
      {
        sub: payload.sub,
        email: payload.email,
        roles: payload.roles,
        permissions: payload.permissions,
      },
      this.secret,
      { expiresIn: this.accessExpiresIn as SignOptions["expiresIn"] }
    );
  }

  verifyAccessToken(token: string): DecodedAccessToken {
    return jwt.verify(token, this.secret) as DecodedAccessToken;
  }

  generateRefreshToken(): string {
    return crypto.randomBytes(REFRESH_TOKEN_BYTES).toString("hex");
  }

  getAccessTokenTtlSeconds(): number {
    return this.accessTtlSeconds;
  }

  getRefreshExpirationDate(): Date {
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + this.refreshExpiresInDays);
    return expiration;
  }

  private parseExpiresInToSeconds(expiresIn: string | number): number {
    if (typeof expiresIn === "number") return expiresIn;

    const match = expiresIn.match(/^(\d+)\s*(s|m|h|d)$/);
    if (!match) return 3600;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return value * (multipliers[unit] ?? 3600);
  }
}
