// modules/users/users.errors.ts

type UserErrorCode =
  | "USER_NOT_FOUND"
  | "USER_EMAIL_CONFLICT"
  | "USER_INVALID_ROLE_IDS"
  | "USER_INVALID_STATUS"
  | "USER_BLOCKED"
  | "USER_CREATE_FAILED";

const HTTP_STATUS = {
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL: 500,
} as const;

export class UserError extends Error {
  public readonly code: UserErrorCode;
  public readonly status: number;

  constructor(message: string, code: UserErrorCode, status: number) {
    super(message);
    this.name = "UserError";
    this.code = code;
    this.status = status;
  }
}

export const UserErrors = {
  notFound: (id: string) =>
    new UserError(
      `Usuario ${id} no encontrado`,
      "USER_NOT_FOUND",
      HTTP_STATUS.NOT_FOUND
    ),

  emailConflict: () =>
    new UserError(
      "El email ya está en uso",
      "USER_EMAIL_CONFLICT",
      HTTP_STATUS.CONFLICT
    ),

  invalidRoleIds: () =>
    new UserError(
      "Los IDs de rol proporcionados no son válidos",
      "USER_INVALID_ROLE_IDS",
      HTTP_STATUS.BAD_REQUEST
    ),

  invalidStatus: (status: string) =>
    new UserError(
      `Estado inválido: ${status}`,
      "USER_INVALID_STATUS",
      HTTP_STATUS.BAD_REQUEST
    ),

  blocked: (id: string) =>
    new UserError(
      `Usuario ${id} está bloqueado`,
      "USER_BLOCKED",
      HTTP_STATUS.FORBIDDEN
    ),

  createFailed: () =>
    new UserError(
      "No se pudo crear el usuario",
      "USER_CREATE_FAILED",
      HTTP_STATUS.INTERNAL
    ),
};
