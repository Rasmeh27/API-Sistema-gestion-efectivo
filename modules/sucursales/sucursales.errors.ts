// modules/sucursales/sucursales.errors.ts

type SucursalErrorCode =
  | "SUCURSAL_NOT_FOUND"
  | "SUCURSAL_CODE_CONFLICT"
  | "SUCURSAL_IN_USE"
  | "SUCURSAL_CREATE_FAILED"
  | "INVALID_SUCURSAL_STATUS";

const HTTP_STATUS = {
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
} as const;

export class SucursalError extends Error {
  constructor(
    public readonly code: SucursalErrorCode,
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

export const SucursalErrors = {
  notFound: (id: string) =>
    new SucursalError(
      "SUCURSAL_NOT_FOUND",
      HTTP_STATUS.NOT_FOUND,
      `Sucursal no encontrada: ${id}`
    ),

  codeConflict: (codigo: string) =>
    new SucursalError(
      "SUCURSAL_CODE_CONFLICT",
      HTTP_STATUS.CONFLICT,
      `Ya existe una sucursal con código "${codigo}"`
    ),

  inUse: () =>
    new SucursalError(
      "SUCURSAL_IN_USE",
      HTTP_STATUS.CONFLICT,
      "No se puede eliminar la sucursal porque tiene cajas, ATMs o usuarios asignados"
    ),

  createFailed: () =>
    new SucursalError(
      "SUCURSAL_CREATE_FAILED",
      HTTP_STATUS.BAD_REQUEST,
      "No se pudo crear la sucursal"
    ),

  invalidStatus: () =>
    new SucursalError(
      "INVALID_SUCURSAL_STATUS",
      HTTP_STATUS.BAD_REQUEST,
      "El estado debe ser ACTIVA o INACTIVA"
    ),
};
