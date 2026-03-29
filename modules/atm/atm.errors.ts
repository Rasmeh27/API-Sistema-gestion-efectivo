// modules/atm/atm.errors.ts

type AtmErrorCode =
  | "ATM_NOT_FOUND"
  | "INSUFFICIENT_FUNDS"
  | "INVALID_AMOUNT"
  | "INVALID_ATM_CONTEXT"
  | "ATM_SESSION_NOT_FOUND"
  | "ATM_SESSION_NOT_OPEN"
  | "ATM_CODE_CONFLICT"
  | "ATM_CASHBOX_CONFLICT";

const HTTP_STATUS: Record<AtmErrorCode, number> = {
  ATM_NOT_FOUND: 404,
  INSUFFICIENT_FUNDS: 409,
  INVALID_AMOUNT: 400,
  INVALID_ATM_CONTEXT: 409,
  ATM_SESSION_NOT_FOUND: 404,
  ATM_SESSION_NOT_OPEN: 409,
  ATM_CODE_CONFLICT: 409,
  ATM_CASHBOX_CONFLICT: 409,
};

export class AtmError extends Error {
  readonly code: AtmErrorCode;
  readonly status: number;

  private constructor(code: AtmErrorCode, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = "AtmError";
  }

  static notFound(id: string): AtmError {
    return new AtmError(
      "ATM_NOT_FOUND",
      HTTP_STATUS.ATM_NOT_FOUND,
      `ATM con id "${id}" no encontrado`
    );
  }

  static insufficientFunds(): AtmError {
    return new AtmError(
      "INSUFFICIENT_FUNDS",
      HTTP_STATUS.INSUFFICIENT_FUNDS,
      "Fondos insuficientes en el ATM para completar el retiro"
    );
  }

  static invalidAmount(): AtmError {
    return new AtmError(
      "INVALID_AMOUNT",
      HTTP_STATUS.INVALID_AMOUNT,
      "El monto debe ser mayor que cero"
    );
  }

  static invalidContext(message: string): AtmError {
    return new AtmError(
      "INVALID_ATM_CONTEXT",
      HTTP_STATUS.INVALID_ATM_CONTEXT,
      message
    );
  }

  static sessionNotFound(id: string): AtmError {
    return new AtmError(
      "ATM_SESSION_NOT_FOUND",
      HTTP_STATUS.ATM_SESSION_NOT_FOUND,
      `Sesión de caja "${id}" no encontrada para operar el ATM`
    );
  }

  static sessionNotOpen(id: string): AtmError {
    return new AtmError(
      "ATM_SESSION_NOT_OPEN",
      HTTP_STATUS.ATM_SESSION_NOT_OPEN,
      `La sesión de caja "${id}" debe estar ABIERTA para operar el ATM`
    );
  }

  static codeConflict(codigo: string): AtmError {
    return new AtmError(
      "ATM_CODE_CONFLICT",
      HTTP_STATUS.ATM_CODE_CONFLICT,
      `Ya existe un ATM con el código "${codigo}"`
    );
  }

  static cashboxConflict(cajaId: string, atmCodigo?: string): AtmError {
    return new AtmError(
      "ATM_CASHBOX_CONFLICT",
      HTTP_STATUS.ATM_CASHBOX_CONFLICT,
      atmCodigo
        ? `La caja "${cajaId}" ya está asociada al ATM "${atmCodigo}"`
        : `La caja "${cajaId}" ya está asociada a otro ATM`
    );
  }
}
