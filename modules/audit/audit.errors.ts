// modules/audit/audit.errors.ts

type AuditErrorCode =
  | "EVENT_NOT_FOUND"
  | "INVALID_DATE_RANGE";

const HTTP_STATUS: Record<AuditErrorCode, number> = {
  EVENT_NOT_FOUND: 404,
  INVALID_DATE_RANGE: 400,
};

export class AuditError extends Error {
  readonly code: AuditErrorCode;
  readonly status: number;

  private constructor(
    code: AuditErrorCode,
    status: number,
    message: string
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = "AuditError";
  }

  static notFound(id: string): AuditError {
    return new AuditError(
      "EVENT_NOT_FOUND",
      HTTP_STATUS.EVENT_NOT_FOUND,
      `Evento de auditoría con id "${id}" no encontrado`
    );
  }

  static invalidDateRange(): AuditError {
    return new AuditError(
      "INVALID_DATE_RANGE",
      HTTP_STATUS.INVALID_DATE_RANGE,
      "La fecha de inicio debe ser anterior a la fecha de fin"
    );
  }
}
