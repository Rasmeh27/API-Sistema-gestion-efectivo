// modules/recommendations/recommendations.dto.ts

// ── Tipos ────────────────────────────────────────────────

export type RecommendationType = "ALERTA" | "OPTIMIZACION" | "PREVISION" | "GENERAL";
export type RecommendationPriority = "ALTA" | "MEDIA" | "BAJA";
export type RecommendationStatus = "PENDIENTE" | "LEIDA" | "DESCARTADA";

export interface RecommendationRecord {
  id: string;
  tipo: RecommendationType;
  prioridad: RecommendationPriority;
  titulo: string;
  descripcion: string;
  datosContexto: Record<string, unknown>;
  estado: RecommendationStatus;
  sucursalId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecommendationDto {
  tipo: RecommendationType;
  prioridad: RecommendationPriority;
  titulo: string;
  descripcion: string;
  datosContexto?: Record<string, unknown>;
  sucursalId?: string;
}

export interface UpdateRecommendationDto {
  estado: RecommendationStatus;
}

export interface ListRecommendationsQuery {
  tipo?: RecommendationType;
  estado?: RecommendationStatus;
  prioridad?: RecommendationPriority;
  sucursalId?: string;
  limit?: number;
}

export interface ChatMessageDto {
  message: string;
  sucursalId?: string;
}

export interface ChatResponse {
  reply: string;
  context: Record<string, unknown>;
}

// ── Helpers ──────────────────────────────────────────────

function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") throw new Error("Valor debe ser texto");
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const VALID_TYPES: RecommendationType[] = ["ALERTA", "OPTIMIZACION", "PREVISION", "GENERAL"];
const VALID_PRIORITIES: RecommendationPriority[] = ["ALTA", "MEDIA", "BAJA"];
const VALID_STATUSES: RecommendationStatus[] = ["PENDIENTE", "LEIDA", "DESCARTADA"];

// ── Parsers ──────────────────────────────────────────────

export function parseUpdateRecommendation(body: unknown): UpdateRecommendationDto {
  if (!body || typeof body !== "object") {
    throw new Error("El cuerpo de la petición es inválido");
  }

  const b = body as Record<string, unknown>;

  if (typeof b.estado !== "string") {
    throw new Error('"estado" es requerido');
  }

  const estado = b.estado.trim().toUpperCase();

  if (!VALID_STATUSES.includes(estado as RecommendationStatus)) {
    throw new Error(`"estado" debe ser uno de: ${VALID_STATUSES.join(", ")}`);
  }

  return { estado: estado as RecommendationStatus };
}

export function parseListRecommendationsQuery(query: unknown): ListRecommendationsQuery {
  if (!query || typeof query !== "object") return {};

  const q = query as Record<string, unknown>;

  const tipo = optionalString(q.tipo)?.toUpperCase();
  const estado = optionalString(q.estado)?.toUpperCase();
  const prioridad = optionalString(q.prioridad)?.toUpperCase();

  return {
    tipo: tipo && VALID_TYPES.includes(tipo as RecommendationType)
      ? (tipo as RecommendationType)
      : undefined,
    estado: estado && VALID_STATUSES.includes(estado as RecommendationStatus)
      ? (estado as RecommendationStatus)
      : undefined,
    prioridad: prioridad && VALID_PRIORITIES.includes(prioridad as RecommendationPriority)
      ? (prioridad as RecommendationPriority)
      : undefined,
    sucursalId: optionalString(q.sucursalId),
    limit: typeof q.limit === "string" ? Math.min(Number(q.limit) || 50, 100) : 50,
  };
}

export function parseChatMessage(body: unknown): ChatMessageDto {
  if (!body || typeof body !== "object") {
    throw new Error("El cuerpo de la petición es inválido");
  }

  const b = body as Record<string, unknown>;

  if (typeof b.message !== "string" || b.message.trim().length === 0) {
    throw new Error('"message" es requerido y no puede estar vacío');
  }

  return {
    message: b.message.trim(),
    sucursalId: optionalString(b.sucursalId),
  };
}
