// modules/cashbox-sessions/cashbox-sessions.dto.ts

export type CashboxSessionStatus = "ABIERTA" | "CERRADA";

export type CashboxSessionRecord = {
  id: string;
  cajaId: string;
  usuarioAperturaId: string;
  fechaApertura: string;
  saldoInicial: number;
  usuarioCierreId: string | null;
  fechaCierre: string | null;
  saldoFinalEsperado: number;
  saldoFinalReal: number;
  diferencia: number;
  estado: CashboxSessionStatus;
};

export type OpenSessionDto = {
  cajaId: string;
  saldoInicial: number;
};

export type CloseSessionDto = {
  saldoFinalReal: number;
};

export type ListSessionsQuery = {
  cajaId?: string;
  estado?: CashboxSessionStatus;
  page: number;
  perPage: number;
};

// ── Parsers ──────────────────────────────────────────────

function requireObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Payload inválido");
  }
  return value as Record<string, unknown>;
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new Error(`${field} debe ser un string`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field} es requerido`);
  }
  return trimmed;
}

function requireNonNegativeNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !isFinite(value) || value < 0) {
    throw new Error(`${field} debe ser un número >= 0`);
  }
  return value;
}

const VALID_STATUSES: CashboxSessionStatus[] = ["ABIERTA", "CERRADA"];

export function parseOpenSession(input: unknown): OpenSessionDto {
  const body = requireObject(input);

  return {
    cajaId: requireNonEmptyString(body.cajaId, "cajaId"),
    saldoInicial: requireNonNegativeNumber(body.saldoInicial, "saldoInicial"),
  };
}

export function parseCloseSession(input: unknown): CloseSessionDto {
  const body = requireObject(input);

  return {
    saldoFinalReal: requireNonNegativeNumber(
      body.saldoFinalReal,
      "saldoFinalReal"
    ),
  };
}

export function parseListSessionsQuery(
  input: Record<string, unknown>
): ListSessionsQuery {
  const page = Number(input.page) || 1;
  const perPage = Number(input.perPage) || 20;

  const result: ListSessionsQuery = { page, perPage };

  if (typeof input.cajaId === "string" && input.cajaId.trim()) {
    result.cajaId = input.cajaId.trim();
  }

  if (typeof input.estado === "string") {
    const upper = input.estado.trim().toUpperCase();
    if (VALID_STATUSES.includes(upper as CashboxSessionStatus)) {
      result.estado = upper as CashboxSessionStatus;
    }
  }

  return result;
}
