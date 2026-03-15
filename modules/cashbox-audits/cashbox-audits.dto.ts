// modules/cashbox-audits/cashbox-audits.dto.ts

// ── Denominaciones DOP ──────────────────────────────────

const DENOMINATIONS = {
  billete2000: 2000,
  billete1000: 1000,
  billete500: 500,
  billete200: 200,
  billete100: 100,
  billete50: 50,
  moneda25: 25,
  moneda10: 10,
  moneda5: 5,
  moneda1: 1,
} as const;

type DenominationKey = keyof typeof DENOMINATIONS;

// ── Tipos ────────────────────────────────────────────────

export interface CashboxAuditRecord {
  id: string;
  sesionCajaId: string;
  usuarioId: string;
  fecha: string;
  saldoContado: number;
  saldoEsperado: number;
  diferencia: number;
  motivoDiferencia: string | null;
  observaciones: string | null;
}

export interface CreateAuditDto {
  sesionCajaId: string;
  saldoContado: number;
  denominaciones: Record<DenominationKey, number>;
  motivoDiferencia?: string;
  observaciones?: string;
}

export interface ListAuditsQuery {
  sesionCajaId?: string;
}

// ── Helpers ──────────────────────────────────────────────

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`"${field}" es requerido y no puede estar vacío`);
  }
  return value.trim();
}

function parseNonNegativeInt(value: unknown, field: string): number {
  const num = Number(value);
  if (isNaN(num) || num < 0 || !Number.isInteger(num)) {
    throw new Error(`"${field}" debe ser un entero mayor o igual a cero`);
  }
  return num;
}

function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") throw new Error("Valor debe ser texto");
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function calculateTotal(counts: Record<DenominationKey, number>): number {
  let total = 0;
  for (const [key, faceValue] of Object.entries(DENOMINATIONS)) {
    total += counts[key as DenominationKey] * faceValue;
  }
  return Math.round(total * 100) / 100;
}

// ── Parsers ──────────────────────────────────────────────

export function parseCreateAudit(body: unknown): CreateAuditDto {
  if (!body || typeof body !== "object") {
    throw new Error("El cuerpo de la petición es inválido");
  }

  const b = body as Record<string, unknown>;

  const denominaciones = {} as Record<DenominationKey, number>;
  for (const key of Object.keys(DENOMINATIONS)) {
    denominaciones[key as DenominationKey] = parseNonNegativeInt(
      b[key] ?? 0,
      key
    );
  }

  const saldoContado = calculateTotal(denominaciones);

  return {
    sesionCajaId: requireNonEmptyString(b.sesionCajaId, "sesionCajaId"),
    saldoContado,
    denominaciones,
    motivoDiferencia: optionalString(b.motivoDiferencia),
    observaciones: optionalString(b.observaciones ?? b.observacion),
  };
}

export function parseListAuditsQuery(query: unknown): ListAuditsQuery {
  if (!query || typeof query !== "object") return {};

  const q = query as Record<string, unknown>;

  return {
    sesionCajaId:
      typeof q.sesionCajaId === "string" && q.sesionCajaId.trim().length > 0
        ? q.sesionCajaId.trim()
        : undefined,
  };
}
