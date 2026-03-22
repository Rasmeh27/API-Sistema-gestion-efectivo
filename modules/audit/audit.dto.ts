// modules/audit/audit.dto.ts

// ── Tipos ────────────────────────────────────────────────

export interface AuditEventRecord {
  id: string;
  fecha: string;
  usuarioId: string;
  accion: string;
  entidadTipo: string;
  entidadId: string;
  resumen: string | null;
  metadata: string | null;
  beforeJson: string | null;
  afterJson: string | null;
}

export interface CreateAuditEventDto {
  usuarioId?: string;
  accion: string;
  entidadTipo: string;
  entidadId: string;
  resumen?: string;
  metadata?: string;
  beforeJson?: string;
  afterJson?: string;
}

export interface ListAuditEventsQuery {
  usuarioId?: string;
  accion?: string;
  entidadTipo?: string;
  entidadId?: string;
  sucursalId?: string;
  desde?: string;
  hasta?: string;
}

// ── Helpers ──────────────────────────────────────────────

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`"${field}" es requerido y no puede estar vacío`);
  }
  return value.trim();
}

function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") throw new Error("Valor debe ser texto");
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isValidISODate(value: string): boolean {
  const date = new Date(value);
  return !isNaN(date.getTime());
}

// ── Parsers ──────────────────────────────────────────────

export function parseCreateAuditEvent(body: unknown): CreateAuditEventDto {
  if (!body || typeof body !== "object") {
    throw new Error("El cuerpo de la petición es inválido");
  }

  const b = body as Record<string, unknown>;

  return {
    usuarioId: optionalString(b.usuarioId),
    accion: requireNonEmptyString(b.accion, "accion"),
    entidadTipo: requireNonEmptyString(b.entidadTipo, "entidadTipo"),
    entidadId: requireNonEmptyString(b.entidadId, "entidadId"),
    resumen: optionalString(b.resumen),
    metadata: optionalString(b.metadata),
    beforeJson: optionalString(b.beforeJson),
    afterJson: optionalString(b.afterJson),
  };
}

export function parseListAuditEventsQuery(query: unknown): ListAuditEventsQuery {
  if (!query || typeof query !== "object") return {};

  const q = query as Record<string, unknown>;

  const desde =
    typeof q.desde === "string" && isValidISODate(q.desde)
      ? q.desde
      : undefined;

  const hasta =
    typeof q.hasta === "string" && isValidISODate(q.hasta)
      ? q.hasta
      : undefined;

  return {
    usuarioId:
      typeof q.usuarioId === "string" && q.usuarioId.trim().length > 0
        ? q.usuarioId.trim()
        : undefined,
    accion:
      typeof q.accion === "string" && q.accion.trim().length > 0
        ? q.accion.trim()
        : undefined,
    entidadTipo:
      typeof q.entidadTipo === "string" && q.entidadTipo.trim().length > 0
        ? q.entidadTipo.trim()
        : undefined,
    entidadId:
      typeof q.entidadId === "string" && q.entidadId.trim().length > 0
        ? q.entidadId.trim()
        : undefined,
    sucursalId:
      typeof q.sucursalId === "string" && q.sucursalId.trim().length > 0
        ? q.sucursalId.trim()
        : undefined,
    desde,
    hasta,
  };
}
