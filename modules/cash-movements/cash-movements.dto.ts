// modules/cash-movements/cash-movements.dto.ts

// ── Tipos ────────────────────────────────────────────────

export type MovementType = "INGRESO" | "EGRESO" | "TRANSFERENCIA" | "REABASTECIMIENTO";

const VALID_TYPES: MovementType[] = ["INGRESO", "EGRESO", "TRANSFERENCIA", "REABASTECIMIENTO"];

export type MovementStatus = "ACTIVO" | "ANULADO";

export interface CashMovementRecord {
  id: string;
  fecha: string;
  tipo: MovementType;
  medio: string;
  monto: number;
  moneda: string;
  referencia: string | null;
  observacion: string | null;
  estado: MovementStatus;
  cajaId: string;
  sesionCajaId: string;
  usuarioId: string;
  cajaOrigenId: string | null;
  cajaDestinoId: string | null;
}

export interface CreateMovementDto {
  tipo: MovementType;
  medio: string;
  monto: number;
  moneda?: string;
  referencia?: string;
  observacion?: string;
  cajaId: string;
  sesionCajaId: string;
  cajaOrigenId?: string;
  cajaDestinoId?: string;
}

export type Currency = "DOP" | "USD" | "EUR";

export interface ListMovementsQuery {
  sesionCajaId?: string;
  cajaId?: string;
  tipo?: MovementType;
  moneda?: Currency;
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

function parseMovementType(value: unknown): MovementType {
  const upper = String(value).toUpperCase().trim();
  if (!VALID_TYPES.includes(upper as MovementType)) {
    throw new Error(`"tipo" debe ser uno de: ${VALID_TYPES.join(", ")}`);
  }
  return upper as MovementType;
}

function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") throw new Error("Valor debe ser texto");
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

// ── Validaciones por tipo ────────────────────────────────

function validateTransferFields(dto: CreateMovementDto): void {
  if (!dto.cajaOrigenId) {
    throw new Error('"cajaOrigenId" es requerido para transferencias');
  }
  if (!dto.cajaDestinoId) {
    throw new Error('"cajaDestinoId" es requerido para transferencias');
  }
  if (dto.cajaOrigenId === dto.cajaDestinoId) {
    throw new Error("La caja origen y destino no pueden ser la misma");
  }
}

function validateReabastecimientoFields(dto: CreateMovementDto): void {
  if (!dto.cajaDestinoId) {
    throw new Error('"cajaDestinoId" es requerido para reabastecimiento');
  }
}

// ── Parsers ──────────────────────────────────────────────

export function parseCreateMovement(body: unknown): CreateMovementDto {
  if (!body || typeof body !== "object") {
    throw new Error("El cuerpo de la petición es inválido");
  }

  const b = body as Record<string, unknown>;

  const dto: CreateMovementDto = {
    tipo: parseMovementType(b.tipo),
    medio: requireNonEmptyString(b.medio, "medio"),
    monto: requirePositiveNumber(b.monto, "monto"),
    moneda: optionalString(b.moneda) ?? "DOP",
    referencia: optionalString(b.referencia),
    observacion: optionalString(b.observacion),
    cajaId: requireNonEmptyString(b.cajaId, "cajaId"),
    sesionCajaId: requireNonEmptyString(b.sesionCajaId, "sesionCajaId"),
    cajaOrigenId: optionalString(b.cajaOrigenId),
    cajaDestinoId: optionalString(b.cajaDestinoId),
  };

  if (dto.tipo === "TRANSFERENCIA") validateTransferFields(dto);
  if (dto.tipo === "REABASTECIMIENTO") validateReabastecimientoFields(dto);

  return dto;
}

const VALID_CURRENCIES: Currency[] = ["DOP", "USD", "EUR"];

export function parseListMovementsQuery(query: unknown): ListMovementsQuery {
  if (!query || typeof query !== "object") return {};

  const q = query as Record<string, unknown>;

  return {
    sesionCajaId:
      typeof q.sesionCajaId === "string" && q.sesionCajaId.trim().length > 0
        ? q.sesionCajaId.trim()
        : undefined,
    cajaId:
      typeof q.cajaId === "string" && q.cajaId.trim().length > 0
        ? q.cajaId.trim()
        : undefined,
    tipo:
      typeof q.tipo === "string" && VALID_TYPES.includes(q.tipo.toUpperCase() as MovementType)
        ? (q.tipo.toUpperCase() as MovementType)
        : undefined,
    moneda:
      typeof q.moneda === "string" && VALID_CURRENCIES.includes(q.moneda.toUpperCase() as Currency)
        ? (q.moneda.toUpperCase() as Currency)
        : undefined,
  };
}
