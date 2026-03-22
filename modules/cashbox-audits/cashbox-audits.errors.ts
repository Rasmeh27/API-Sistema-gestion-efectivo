// modules/cashbox-audits/cashbox-audits.errors.ts

type CashboxAuditErrorCode =
  | "AUDIT_NOT_FOUND"
  | "SESSION_NOT_FOUND"
  | "SESSION_NOT_OPEN";

const HTTP_STATUS = {
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
} as const;

export class CashboxAuditError extends Error {
  constructor(
    public readonly code: CashboxAuditErrorCode,
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

export const CashboxAuditErrors = {
  notFound: (id: string) =>
    new CashboxAuditError(
      "AUDIT_NOT_FOUND",
      HTTP_STATUS.NOT_FOUND,
      `Arqueo no encontrado: ${id}`
    ),

  sessionNotFound: (id: string) =>
    new CashboxAuditError(
      "SESSION_NOT_FOUND",
      HTTP_STATUS.NOT_FOUND,
      `Sesión de caja no encontrada: ${id}`
    ),

  sessionNotOpen: () =>
    new CashboxAuditError(
      "SESSION_NOT_OPEN",
      HTTP_STATUS.CONFLICT,
      "La sesión debe estar abierta para realizar un arqueo"
    ),
};
