// modules/cash-movements/cash-movements.errors.ts

type CashMovementErrorCode =
  | "MOVEMENT_NOT_FOUND"
  | "SESSION_NOT_FOUND"
  | "SESSION_NOT_OPEN"
  | "INVALID_AMOUNT"
  | "INSUFFICIENT_FUNDS";

const HTTP_STATUS: Record<CashMovementErrorCode, number> = {
  MOVEMENT_NOT_FOUND: 404,
  SESSION_NOT_FOUND: 404,
  SESSION_NOT_OPEN: 409,
  INVALID_AMOUNT: 400,
  INSUFFICIENT_FUNDS: 409,
};

export class CashMovementError extends Error {
  readonly code: CashMovementErrorCode;
  readonly status: number;

  private constructor(
    code: CashMovementErrorCode,
    status: number,
    message: string
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = "CashMovementError";
  }

  static notFound(id: string): CashMovementError {
    return new CashMovementError(
      "MOVEMENT_NOT_FOUND",
      HTTP_STATUS.MOVEMENT_NOT_FOUND,
      `Movimiento con id "${id}" no encontrado`
    );
  }

  static sessionNotFound(id: string): CashMovementError {
    return new CashMovementError(
      "SESSION_NOT_FOUND",
      HTTP_STATUS.SESSION_NOT_FOUND,
      `Sesión de caja con id "${id}" no encontrada`
    );
  }

  static sessionNotOpen(): CashMovementError {
    return new CashMovementError(
      "SESSION_NOT_OPEN",
      HTTP_STATUS.SESSION_NOT_OPEN,
      "La sesión debe estar abierta para registrar movimientos"
    );
  }

  static invalidAmount(): CashMovementError {
    return new CashMovementError(
      "INVALID_AMOUNT",
      HTTP_STATUS.INVALID_AMOUNT,
      "El monto debe ser un número mayor a cero"
    );
  }

  static insufficientFunds(): CashMovementError {
    return new CashMovementError(
      "INSUFFICIENT_FUNDS",
      HTTP_STATUS.INSUFFICIENT_FUNDS,
      "Fondos insuficientes para realizar el egreso"
    );
  }
}
