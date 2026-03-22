type AtmErrorCode =
  | "ATM_NOT_FOUND"
  | "INSUFFICIENT_FUNDS"
  | "INVALID_AMOUNT";

const HTTP_STATUS: Record<AtmErrorCode, number> = {
  ATM_NOT_FOUND: 404,
  INSUFFICIENT_FUNDS: 400,
  INVALID_AMOUNT: 400,
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
      "Fondos insuficientes en el ATM"
    );
  }

  static invalidAmount(): AtmError {
    return new AtmError(
      "INVALID_AMOUNT",
      HTTP_STATUS.INVALID_AMOUNT,
      "El monto debe ser mayor que cero"
    );
  }
}