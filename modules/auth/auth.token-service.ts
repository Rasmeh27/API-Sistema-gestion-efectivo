import Jwt, { Secret, SignOptions } from "jsonwebtoken";

export type TokenPayload = {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
};

export interface TokenService {
  signAccessToken(payload: TokenPayload): string;
}

export class JwtTokenService implements TokenService {
  private readonly secret: Secret;
  private readonly expiresIn: SignOptions["expiresIn"];

  constructor(params: { secret: string; expiresIn: SignOptions["expiresIn"] }) {
    if (!params.secret || !params.secret.trim()) {
      throw new Error("JWT secret is required");
    }

    this.secret = params.secret;
    this.expiresIn = params.expiresIn;
  }

  signAccessToken(payload: TokenPayload): string {
    return Jwt.sign(
      {
        sub: payload.sub,
        email: payload.email,
        roles: payload.roles,
        permissions: payload.permissions,
      },
      this.secret,
      {
        expiresIn: this.expiresIn,
      }
    );
  }
}