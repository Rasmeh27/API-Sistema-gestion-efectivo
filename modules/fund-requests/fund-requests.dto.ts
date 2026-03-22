// modules/fund-requests/fund-requests.dto.ts

// ── Tipos ────────────────────────────────────────────────

export type RequestStatus = "PENDIENTE" | "APROBADA" | "RECHAZADA" | "EJECUTADA";

const VALID_STATUSES: RequestStatus[] = ["PENDIENTE", "APROBADA", "RECHAZADA", "EJECUTADA"];

export type Decision = "APROBADA" | "RECHAZADA";

const VALID_DECISIONS: Decision[] = ["APROBADA", "RECHAZADA"];

export type Priority = "BAJA" | "MEDIA" | "ALTA" | "URGENTE";

const VALID_PRIORITIES: Priority[] = ["BAJA", "MEDIA", "ALTA", "URGENTE"];

export interface FundRequestRecord {
  id: string;
  origenScope: string;
  origenId: string;
  destinoScope: string;
  destinoId: string;
  monto: number;
  moneda: string;
  motivo: string;
  prioridad: Priority;
  estado: RequestStatus;
  solicitadaPor: string;
  fechaSolicitud: string;
  aprobadaPor: string | null;
  fechaAprobacion: string | null;
  motivoRechazo: string | null;
}

export interface ApprovalRecord {
  id: string;
  solicitudId: string;
  usuarioId: string;
  decision: Decision;
  comentario: string | null;
  fecha: string;
}

const VALID_CURRENCIES = ["DOP", "USD", "EUR"] as const;
export type Currency = typeof VALID_CURRENCIES[number];

export interface CreateFundRequestDto {
  origenScope: string;
  origenId: string;
  destinoScope: string;
  destinoId: string;
  monto: number;
  moneda?: Currency;
  motivo: string;
  prioridad?: Priority;
}

export interface ResolveRequestDto {
  decision: Decision;
  comentario?: string;
  motivoRechazo?: string;
}

export interface ListFundRequestsQuery {
  origenScope?: string;
  origenId?: string;
  estado?: RequestStatus;
  prioridad?: Priority;
}

// ── Helpers ──────────────────────────────────────────────

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`"${field}" es requerido y no puede estar vacío`);
  }
  return value.trim();
}

function requirePositiveNumber(value: unknown, field: string): number {
  const num = Number(value);
  if (isNaN(num) || num <= 0) {
    throw new Error(`"${field}" debe ser un número mayor a cero`);
  }
  return num;
}

function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") throw new Error("Valor debe ser texto");
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

// ── Parsers ──────────────────────────────────────────────

export function parseCreateFundRequest(body: unknown): CreateFundRequestDto {
  if (!body || typeof body !== "object") {
    throw new Error("El cuerpo de la petición es inválido");
  }

  const b = body as Record<string, unknown>;

  const prioridad = optionalString(b.prioridad)?.toUpperCase();
  const monedaRaw = optionalString(b.moneda)?.toUpperCase();

  return {
    origenScope: requireNonEmptyString(b.origenScope, "origenScope"),
    origenId: requireNonEmptyString(b.origenId, "origenId"),
    destinoScope: requireNonEmptyString(b.destinoScope, "destinoScope"),
    destinoId: requireNonEmptyString(b.destinoId, "destinoId"),
    monto: requirePositiveNumber(b.monto, "monto"),
    moneda: monedaRaw && (VALID_CURRENCIES as readonly string[]).includes(monedaRaw)
      ? (monedaRaw as Currency)
      : "DOP",
    motivo: requireNonEmptyString(b.motivo, "motivo"),
    prioridad: prioridad && VALID_PRIORITIES.includes(prioridad as Priority)
      ? (prioridad as Priority)
      : "MEDIA",
  };
}

export function parseResolveRequest(body: unknown): ResolveRequestDto {
  if (!body || typeof body !== "object") {
    throw new Error("El cuerpo de la petición es inválido");
  }

  const b = body as Record<string, unknown>;

  const decision = String(b.decision).toUpperCase().trim();
  if (!VALID_DECISIONS.includes(decision as Decision)) {
    throw new Error(`"decision" debe ser una de: ${VALID_DECISIONS.join(", ")}`);
  }

  return {
    decision: decision as Decision,
    comentario: optionalString(b.comentario),
    motivoRechazo: optionalString(b.motivoRechazo),
  };
}

export function parseListFundRequestsQuery(query: unknown): ListFundRequestsQuery {
  if (!query || typeof query !== "object") return {};

  const q = query as Record<string, unknown>;

  return {
    origenScope:
      typeof q.origenScope === "string" && q.origenScope.trim().length > 0
        ? q.origenScope.trim()
        : undefined,
    origenId:
      typeof q.origenId === "string" && q.origenId.trim().length > 0
        ? q.origenId.trim()
        : undefined,
    estado:
      typeof q.estado === "string" && VALID_STATUSES.includes(q.estado.toUpperCase() as RequestStatus)
        ? (q.estado.toUpperCase() as RequestStatus)
        : undefined,
    prioridad:
      typeof q.prioridad === "string" && VALID_PRIORITIES.includes(q.prioridad.toUpperCase() as Priority)
        ? (q.prioridad.toUpperCase() as Priority)
        : undefined,
  };
}
