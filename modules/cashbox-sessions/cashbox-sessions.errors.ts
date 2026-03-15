// modules/cashbox-sessions/cashbox-sessions.errors.ts

type CashboxSessionErrorCode =
  | "SESSION_NOT_FOUND"
  | "SESSION_ALREADY_OPEN"
  | "SESSION_ALREADY_CLOSED"
  | "CASHBOX_NOT_FOUND"
  | "CASHBOX_INACTIVE"
  | "INVALID_AMOUNT";

const HTTP_STATUS = {
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
} as const;

export class CashboxSessionError extends Error {
  constructor(
    public readonly code: CashboxSessionErrorCode,
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

export const CashboxSessionErrors = {
  notFound: (id: string) =>
    new CashboxSessionError(
      "SESSION_NOT_FOUND",
      HTTP_STATUS.NOT_FOUND,
      `Sesión de caja no encontrada: ${id}`
    ),

  alreadyOpen: (cajaId: string) =>
    new CashboxSessionError(
      "SESSION_ALREADY_OPEN",
      HTTP_STATUS.CONFLICT,
      `La caja ${cajaId} ya tiene una sesión abierta`
    ),

  alreadyClosed: (id: string) =>
    new CashboxSessionError(
      "SESSION_ALREADY_CLOSED",
      HTTP_STATUS.BAD_REQUEST,
      `La sesión ${id} ya está cerrada`
    ),

  cashboxNotFound: (cajaId: string) =>
    new CashboxSessionError(
      "CASHBOX_NOT_FOUND",
      HTTP_STATUS.NOT_FOUND,
      `Caja no encontrada: ${cajaId}`
    ),

  cashboxInactive: (cajaId: string) =>
    new CashboxSessionError(
      "CASHBOX_INACTIVE",
      HTTP_STATUS.BAD_REQUEST,
      `La caja ${cajaId} no está activa`
    ),

  invalidAmount: (field: string) =>
    new CashboxSessionError(
      "INVALID_AMOUNT",
      HTTP_STATUS.BAD_REQUEST,
      `${field} debe ser un monto válido (>= 0)`
    ),
};
