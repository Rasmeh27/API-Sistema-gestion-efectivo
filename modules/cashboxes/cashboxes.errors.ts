export class CashboxError extends Error {
  public readonly Code: string;
  public readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.Code = code;
    this.status = status;
  }
}

export const CashboxErrors = {
  invalidData: () =>
    new CashboxError("Datos inválidos para la caja", "INVALID_DATA", 400),

  notFound: () =>
    new CashboxError("Caja no encontrada", "CASHBOX_NOT_FOUND", 404),

  alreadyExists: () =>
    new CashboxError("La caja ya existe", "CASHBOX_ALREADY_EXISTS", 409),

  internal: () =>
    new CashboxError("Error interno en Cashboxes", "CASHBOX_INTERNAL_ERROR", 500),
};