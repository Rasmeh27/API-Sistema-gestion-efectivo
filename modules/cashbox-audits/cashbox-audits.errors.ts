// modules/cashbox-audits/cashbox-audits.errors.ts

type CashboxAuditErrorCode =
  | "AUDIT_NOT_FOUND"
  | "SESSION_NOT_FOUND"
  | "SESSION_NOT_CLOSED"
  | "INVALID_AMOUNT";

const HTTP_STATUS: Record<CashboxAuditErrorCode, number> = {
  AUDIT_NOT_FOUND: 404,
  SESSION_NOT_FOUND: 404,
  SESSION_NOT_CLOSED: 409,
  INVALID_AMOUNT: 400,
};

export class CashboxAuditError extends Error {
  readonly code: CashboxAuditErrorCode;
  readonly status: number;

  private constructor(
    code: CashboxAuditErrorCode,
    status: number,
    message: string
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = "CashboxAuditError";
  }

  static notFound(id: string): CashboxAuditError {
    return new CashboxAuditError(
      "AUDIT_NOT_FOUND",
      HTTP_STATUS.AUDIT_NOT_FOUND,
      `Arqueo con id "${id}" no encontrado`
    );
  }

  static sessionNotFound(id: string): CashboxAuditError {
    return new CashboxAuditError(
      "SESSION_NOT_FOUND",
      HTTP_STATUS.SESSION_NOT_FOUND,
      `Sesión de caja con id "${id}" no encontrada`
    );
  }

  static sessionNotClosed(): CashboxAuditError {
    return new CashboxAuditError(
      "SESSION_NOT_CLOSED",
      HTTP_STATUS.SESSION_NOT_CLOSED,
      "La sesión debe estar cerrada para realizar un arqueo"
    );
  }

  static invalidAmount(field: string): CashboxAuditError {
    return new CashboxAuditError(
      "INVALID_AMOUNT",
      HTTP_STATUS.INVALID_AMOUNT,
      `El campo "${field}" debe ser un número positivo o cero`
    );
  }
}
