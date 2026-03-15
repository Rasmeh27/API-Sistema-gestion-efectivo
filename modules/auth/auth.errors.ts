// modules/auth/auth.errors.ts

type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "AUTH_MISSING_TOKEN"
  | "AUTH_INVALID_TOKEN"
  | "AUTH_TOKEN_EXPIRED"
  | "AUTH_USER_BLOCKED"
  | "AUTH_SESSION_REVOKED"
  | "AUTH_SESSION_EXPIRED"
  | "AUTH_SESSION_NOT_FOUND";

const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
} as const;

export class AuthError extends Error {
  public readonly code: AuthErrorCode;
  public readonly status: number;

  constructor(message: string, code: AuthErrorCode, status: number) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.status = status;
  }
}

export const AuthErrors = {
  invalidCredentials: () =>
    new AuthError(
      "Credenciales incorrectas",
      "INVALID_CREDENTIALS",
      HTTP_STATUS.UNAUTHORIZED
    ),

  missingToken: () =>
    new AuthError(
      "Token de autenticación no proporcionado",
      "AUTH_MISSING_TOKEN",
      HTTP_STATUS.UNAUTHORIZED
    ),

  invalidToken: () =>
    new AuthError(
      "Token inválido",
      "AUTH_INVALID_TOKEN",
      HTTP_STATUS.UNAUTHORIZED
    ),

  tokenExpired: () =>
    new AuthError(
      "Token expirado",
      "AUTH_TOKEN_EXPIRED",
      HTTP_STATUS.UNAUTHORIZED
    ),

  userBlocked: () =>
    new AuthError(
      "Usuario bloqueado. Contacte al administrador",
      "AUTH_USER_BLOCKED",
      HTTP_STATUS.FORBIDDEN
    ),

  sessionRevoked: () =>
    new AuthError(
      "Sesión revocada",
      "AUTH_SESSION_REVOKED",
      HTTP_STATUS.UNAUTHORIZED
    ),

  sessionExpired: () =>
    new AuthError(
      "Sesión expirada",
      "AUTH_SESSION_EXPIRED",
      HTTP_STATUS.UNAUTHORIZED
    ),

  sessionNotFound: () =>
    new AuthError(
      "Sesión no encontrada",
      "AUTH_SESSION_NOT_FOUND",
      HTTP_STATUS.NOT_FOUND
    ),
};
