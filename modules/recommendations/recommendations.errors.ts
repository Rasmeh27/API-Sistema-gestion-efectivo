// modules/recommendations/recommendations.errors.ts

type RecommendationErrorCode =
  | "RECOMMENDATION_NOT_FOUND"
  | "INVALID_STATUS"
  | "LLM_UNAVAILABLE"
  | "LLM_ERROR"
  | "MISSING_HF_TOKEN";

const HTTP_STATUS: Record<RecommendationErrorCode, number> = {
  RECOMMENDATION_NOT_FOUND: 404,
  INVALID_STATUS: 400,
  LLM_UNAVAILABLE: 503,
  LLM_ERROR: 502,
  MISSING_HF_TOKEN: 500,
};

export class RecommendationError extends Error {
  readonly code: RecommendationErrorCode;
  readonly status: number;

  private constructor(
    code: RecommendationErrorCode,
    status: number,
    message: string
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = "RecommendationError";
  }

  static notFound(id: string): RecommendationError {
    return new RecommendationError(
      "RECOMMENDATION_NOT_FOUND",
      HTTP_STATUS.RECOMMENDATION_NOT_FOUND,
      `Recomendación con id "${id}" no encontrada`
    );
  }

  static invalidStatus(status: string): RecommendationError {
    return new RecommendationError(
      "INVALID_STATUS",
      HTTP_STATUS.INVALID_STATUS,
      `Estado "${status}" no es válido. Use: PENDIENTE, LEIDA, DESCARTADA`
    );
  }

  static llmUnavailable(): RecommendationError {
    return new RecommendationError(
      "LLM_UNAVAILABLE",
      HTTP_STATUS.LLM_UNAVAILABLE,
      "El servicio de IA no está disponible en este momento"
    );
  }

  static llmError(detail: string): RecommendationError {
    return new RecommendationError(
      "LLM_ERROR",
      HTTP_STATUS.LLM_ERROR,
      `Error del servicio de IA: ${detail}`
    );
  }

  static missingToken(): RecommendationError {
    return new RecommendationError(
      "MISSING_HF_TOKEN",
      HTTP_STATUS.MISSING_HF_TOKEN,
      "HF_TOKEN no está configurado. Configure la variable de entorno HF_TOKEN"
    );
  }
}
