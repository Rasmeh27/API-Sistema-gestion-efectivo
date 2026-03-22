// modules/cashbox-audits/cashbox-audits.dto.ts

// ── Denominaciones por moneda ─────────────────────────

const DENOMINATIONS_DOP = {
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

const DENOMINATIONS_USD = {
  billete100: 100,
  billete50: 50,
  billete20: 20,
  billete10: 10,
  billete5: 5,
  billete1: 1,
  moneda050: 0.5,
  moneda025: 0.25,
  moneda010: 0.10,
  moneda005: 0.05,
  moneda001: 0.01,
} as const;

const DENOMINATIONS_EUR = {
  billete500: 500,
  billete200: 200,
  billete100: 100,
  billete50: 50,
  billete20: 20,
  billete10: 10,
  billete5: 5,
  moneda2: 2,
  moneda1: 1,
  moneda050: 0.5,
  moneda020: 0.20,
  moneda010: 0.10,
  moneda005: 0.05,
  moneda002: 0.02,
  moneda001: 0.01,
} as const;

export type Currency = "DOP" | "USD" | "EUR";

const DENOMINATIONS_BY_CURRENCY = {
  DOP: DENOMINATIONS_DOP,
  USD: DENOMINATIONS_USD,
  EUR: DENOMINATIONS_EUR,
} as const;

type DenominationsDOP = typeof DENOMINATIONS_DOP;
type DenominationsUSD = typeof DENOMINATIONS_USD;
type DenominationsEUR = typeof DENOMINATIONS_EUR;

type DenominationKey =
  | keyof DenominationsDOP
  | keyof DenominationsUSD
  | keyof DenominationsEUR;

// ── Tipos ────────────────────────────────────────────────

export interface CashboxAuditRecord {
  id: string;
  sesionCajaId: string;
  usuarioId: string;
  fecha: string;
  moneda: Currency;
  saldoContado: number;
  saldoEsperado: number;
  diferencia: number;
  motivoDiferencia: string | null;
  observaciones: string | null;
}

export interface CreateAuditDto {
  sesionCajaId: string;
  moneda: Currency;
  saldoContado: number;
  denominaciones: Partial<Record<DenominationKey, number>>;
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

function calculateTotal(
  counts: Partial<Record<DenominationKey, number>>,
  moneda: Currency
): number {
  const denominations = DENOMINATIONS_BY_CURRENCY[moneda] as Record<string, number>;
  let total = 0;
  for (const [key, faceValue] of Object.entries(denominations)) {
    total += (counts[key as DenominationKey] ?? 0) * faceValue;
  }
  return Math.round(total * 100) / 100;
}

// ── Parsers ──────────────────────────────────────────────

export function parseCreateAudit(body: unknown): CreateAuditDto {
  if (!body || typeof body !== "object") {
    throw new Error("El cuerpo de la petición es inválido");
  }

  const b = body as Record<string, unknown>;

  const monedaRaw = (optionalString(b.moneda) ?? "DOP").toUpperCase();
  const moneda: Currency = (["DOP", "USD", "EUR"].includes(monedaRaw) ? monedaRaw : "DOP") as Currency;

  const denominations = DENOMINATIONS_BY_CURRENCY[moneda] as Record<string, number>;
  const denominaciones = {} as Partial<Record<DenominationKey, number>>;
  for (const key of Object.keys(denominations)) {
    if (b[key] !== undefined) {
      denominaciones[key as DenominationKey] = parseNonNegativeInt(b[key], key);
    }
  }

  const saldoContado = calculateTotal(denominaciones, moneda);

  return {
    sesionCajaId: requireNonEmptyString(b.sesionCajaId, "sesionCajaId"),
    moneda,
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
