// modules/fund-requests/fund-requests.errors.ts

type FundRequestErrorCode =
  | "REQUEST_NOT_FOUND"
  | "SUCURSAL_NOT_FOUND"
  | "INVALID_AMOUNT"
  | "ALREADY_RESOLVED"
  | "INVALID_STATUS";

const HTTP_STATUS: Record<FundRequestErrorCode, number> = {
  REQUEST_NOT_FOUND: 404,
  SUCURSAL_NOT_FOUND: 404,
  INVALID_AMOUNT: 400,
  ALREADY_RESOLVED: 409,
  INVALID_STATUS: 400,
};

export class FundRequestError extends Error {
  readonly code: FundRequestErrorCode;
  readonly status: number;

  private constructor(
    code: FundRequestErrorCode,
    status: number,
    message: string
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = "FundRequestError";
  }

  static notFound(id: string): FundRequestError {
    return new FundRequestError(
      "REQUEST_NOT_FOUND",
      HTTP_STATUS.REQUEST_NOT_FOUND,
      `Solicitud de fondos con id "${id}" no encontrada`
    );
  }

  static sucursalNotFound(id: string): FundRequestError {
    return new FundRequestError(
      "SUCURSAL_NOT_FOUND",
      HTTP_STATUS.SUCURSAL_NOT_FOUND,
      `Sucursal con id "${id}" no encontrada`
    );
  }

  static invalidAmount(): FundRequestError {
    return new FundRequestError(
      "INVALID_AMOUNT",
      HTTP_STATUS.INVALID_AMOUNT,
      "El monto debe ser un número mayor a cero"
    );
  }

  static alreadyResolved(): FundRequestError {
    return new FundRequestError(
      "ALREADY_RESOLVED",
      HTTP_STATUS.ALREADY_RESOLVED,
      "La solicitud ya fue aprobada o rechazada"
    );
  }

  static invalidStatus(status: string): FundRequestError {
    return new FundRequestError(
      "INVALID_STATUS",
      HTTP_STATUS.INVALID_STATUS,
      `Estado "${status}" no es válido`
    );
  }
}
