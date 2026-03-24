// modules/kpis/kpis.dto.ts

// ── Tipos ────────────────────────────────────────────────

export interface KpiSnapshotRecord {
  id: string;
  fecha: string;
  scope: string;
  scopeId: string;
  metricasJson: Record<string, unknown>;
}

export interface CreateKpiSnapshotDto {
  scope: string;
  scopeId: string;
  metricasJson: Record<string, unknown>;
}

export interface ListKpiSnapshotsQuery {
  scope?: string;
  scopeId?: string;
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

function requireObject(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`"${field}" debe ser un objeto JSON válido`);
  }
  return value as Record<string, unknown>;
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

export function parseCreateKpiSnapshot(body: unknown): CreateKpiSnapshotDto {
  if (!body || typeof body !== "object") {
    throw new Error("El cuerpo de la petición es inválido");
  }

  const b = body as Record<string, unknown>;

  return {
    scope: requireNonEmptyString(b.scope, "scope"),
    scopeId: requireNonEmptyString(b.scopeId, "scopeId"),
    metricasJson: requireObject(b.metricasJson, "metricasJson"),
  };
}

// ── Dashboard en tiempo real ─────────────────────────────

export interface DashboardQuery {
  sucursalId?: string;
}

export interface CashSummary {
  efectivoTotalEnCirculacion: number;
  cajasAbiertas: number;
  cajasCerradas: number;
}

export interface TransactionVolume {
  tipo: string;
  cantidad: number;
  total: number;
}

export interface BalanceAlert {
  arqueoId: string;
  cajaId: string;
  diferencia: number;
  fecha: string;
}

export interface RecentOperation {
  accion: string;
  resumen: string | null;
  fecha: string;
  usuario: string | null;
}

export interface DashboardResponse {
  cashSummary: CashSummary;
  transactionVolume24h: TransactionVolume[];
  transactionVolume7d: TransactionVolume[];
  transactionVolume30d: TransactionVolume[];
  balanceAlerts: BalanceAlert[];
  recentOperations: RecentOperation[];
}

export function parseDashboardQuery(query: unknown): DashboardQuery {
  if (!query || typeof query !== "object") return {};

  const q = query as Record<string, unknown>;

  return {
    sucursalId:
      typeof q.sucursalId === "string" && q.sucursalId.trim().length > 0
        ? q.sucursalId.trim()
        : undefined,
  };
}

// ── Trend (Time-Series) ─────────────────────────────────

export type GroupBy = "day" | "week" | "month";

export interface TrendQuery {
  from: string;
  to: string;
  groupBy: GroupBy;
  sucursalId?: string;
}

export interface TrendDataPoint {
  fecha: string;
  ingresos: number;
  egresos: number;
  balance: number;
}

export function parseTrendQuery(query: unknown): TrendQuery {
  if (!query || typeof query !== "object") {
    throw new Error('"from" y "to" son requeridos');
  }

  const q = query as Record<string, unknown>;

  const from = typeof q.from === "string" && isValidISODate(q.from) ? q.from.trim() : undefined;
  const to = typeof q.to === "string" && isValidISODate(q.to) ? q.to.trim() : undefined;

  if (!from || !to) {
    throw new Error('"from" y "to" son requeridos y deben ser fechas ISO válidas');
  }

  const validGroupBy: GroupBy[] = ["day", "week", "month"];
  const rawGroupBy = typeof q.groupBy === "string" ? q.groupBy.trim().toLowerCase() : "day";
  const groupBy = validGroupBy.includes(rawGroupBy as GroupBy) ? (rawGroupBy as GroupBy) : "day";

  return {
    from,
    to,
    groupBy,
    sucursalId:
      typeof q.sucursalId === "string" && q.sucursalId.trim().length > 0
        ? q.sucursalId.trim()
        : undefined,
  };
}

// ── Average Balance ─────────────────────────────────────

export interface AverageBalanceQuery {
  sucursalId?: string;
  from?: string;
  to?: string;
}

export interface AverageBalanceByCaja {
  cajaId: string;
  cajaNombre: string;
  promedio: number;
}

export interface AverageBalanceResponse {
  promedioGeneral: number;
  porCaja: AverageBalanceByCaja[];
}

export function parseAverageBalanceQuery(query: unknown): AverageBalanceQuery {
  if (!query || typeof query !== "object") return {};

  const q = query as Record<string, unknown>;

  return {
    sucursalId:
      typeof q.sucursalId === "string" && q.sucursalId.trim().length > 0
        ? q.sucursalId.trim()
        : undefined,
    from:
      typeof q.from === "string" && isValidISODate(q.from) ? q.from.trim() : undefined,
    to:
      typeof q.to === "string" && isValidISODate(q.to) ? q.to.trim() : undefined,
  };
}

// ── Geographic Distribution ─────────────────────────────

export interface GeographicDistributionItem {
  sucursalId: string;
  nombre: string;
  codigo: string;
  latitud: number | null;
  longitud: number | null;
  efectivoTotal: number;
  cajasAbiertas: number;
  cajasCerradas: number;
}

export function parseListKpiSnapshotsQuery(query: unknown): ListKpiSnapshotsQuery {
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
    scope: optionalString(q.scope),
    scopeId: optionalString(q.scopeId),
    desde,
    hasta,
  };
}
