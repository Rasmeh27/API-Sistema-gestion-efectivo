// modules/cashboxes/cashboxes.errors.ts

type CashboxErrorCode =
  | "CASHBOX_NOT_FOUND"
  | "CASHBOX_CODE_CONFLICT"
  | "CASHBOX_IN_USE"
  | "CASHBOX_CREATE_FAILED"
  | "INVALID_CASHBOX_STATUS"
  | "CASHBOX_BLOCKED";

const HTTP_STATUS = {
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
} as const;

export class CashboxError extends Error {
  constructor(
    public readonly code: CashboxErrorCode,
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

export const CashboxErrors = {
  notFound: (id: string) =>
    new CashboxError(
      "CASHBOX_NOT_FOUND",
      HTTP_STATUS.NOT_FOUND,
      `Caja no encontrada: ${id}`
    ),

  codeConflict: (codigo: string) =>
    new CashboxError(
      "CASHBOX_CODE_CONFLICT",
      HTTP_STATUS.CONFLICT,
      `Ya existe una caja con código "${codigo}"`
    ),

  inUse: () =>
    new CashboxError(
      "CASHBOX_IN_USE",
      HTTP_STATUS.BAD_REQUEST,
      "No se puede eliminar la caja porque tiene sesiones activas"
    ),

  createFailed: () =>
    new CashboxError(
      "CASHBOX_CREATE_FAILED",
      HTTP_STATUS.BAD_REQUEST,
      "No se pudo crear la caja"
    ),

  invalidStatus: () =>
    new CashboxError(
      "INVALID_CASHBOX_STATUS",
      HTTP_STATUS.BAD_REQUEST,
      "El estado debe ser ACTIVA, INACTIVA o EN_MANTENIMIENTO"
    ),

  blocked: (id: string) =>
    new CashboxError(
      "CASHBOX_BLOCKED",
      HTTP_STATUS.BAD_REQUEST,
      `La caja ${id} está bloqueada y no puede operar`
    ),
};
