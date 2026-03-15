// modules/kpis/kpis.errors.ts

type KpiErrorCode =
  | "SNAPSHOT_NOT_FOUND"
  | "INVALID_DATE_RANGE";

const HTTP_STATUS: Record<KpiErrorCode, number> = {
  SNAPSHOT_NOT_FOUND: 404,
  INVALID_DATE_RANGE: 400,
};

export class KpiError extends Error {
  readonly code: KpiErrorCode;
  readonly status: number;

  private constructor(
    code: KpiErrorCode,
    status: number,
    message: string
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = "KpiError";
  }

  static notFound(id: string): KpiError {
    return new KpiError(
      "SNAPSHOT_NOT_FOUND",
      HTTP_STATUS.SNAPSHOT_NOT_FOUND,
      `KPI snapshot con id "${id}" no encontrado`
    );
  }

  static invalidDateRange(): KpiError {
    return new KpiError(
      "INVALID_DATE_RANGE",
      HTTP_STATUS.INVALID_DATE_RANGE,
      "La fecha de inicio debe ser anterior a la fecha de fin"
    );
  }
}
