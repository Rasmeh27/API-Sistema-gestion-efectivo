// modules/roles/roles.errors.ts

type RoleErrorCode =
  | "ROLE_NOT_FOUND"
  | "ROLE_NAME_CONFLICT"
  | "INVALID_PERMISSION_IDS"
  | "ROLE_IN_USE"
  | "ROLE_CREATE_FAILED";

const HTTP_STATUS = {
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
} as const;

export class RoleError extends Error {
  constructor(
    public readonly code: RoleErrorCode,
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

export const RoleErrors = {
  notFound: (id: string) =>
    new RoleError(
      "ROLE_NOT_FOUND",
      HTTP_STATUS.NOT_FOUND,
      `No se encontró el rol con id ${id}`
    ),

  nameConflict: (name: string) =>
    new RoleError(
      "ROLE_NAME_CONFLICT",
      HTTP_STATUS.CONFLICT,
      `Ya existe un rol con el nombre "${name}"`
    ),

  invalidPermissionIds: () =>
    new RoleError(
      "INVALID_PERMISSION_IDS",
      HTTP_STATUS.BAD_REQUEST,
      "Uno o más permissionsIds no existen"
    ),

  roleInUse: () =>
    new RoleError(
      "ROLE_IN_USE",
      HTTP_STATUS.BAD_REQUEST,
      "No se puede eliminar el rol porque está asignado a uno o más usuarios"
    ),

  createFailed: () =>
    new RoleError(
      "ROLE_CREATE_FAILED",
      HTTP_STATUS.BAD_REQUEST,
      "No se pudo crear el rol"
    ),
};
