export interface AtmRecord {
  id: string;
  sucursalId: string;
  cajaId: string;
  codigo: string;
  nombre: string;
  estado: string;
  moneda: string;
  limiteOperativo: number;
}

export interface DepositDto {
  monto: number;
  motivo?: string;
  sesionCajaId: string;   // ← nuevo
}

export interface WithdrawDto {
  monto: number;
  motivo?: string;
  sesionCajaId: string;   // ← nuevo
}

// ── Helpers ──────────────────────────────────────────────

function requirePositiveNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || isNaN(value) || value <= 0) {
    throw new Error(`"${field}" debe ser un número positivo`);
  }
  return value;
}

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

// ── Parsers ──────────────────────────────────────────────

export function parseDeposit(body: unknown): DepositDto {
  if (!body || typeof body !== "object") {
    throw new Error("El cuerpo de la petición es inválido");
  }
  const b = body as Record<string, unknown>;
  return {
    monto: requirePositiveNumber(b.monto, "monto"),
    motivo: optionalString(b.motivo),
    sesionCajaId: requireNonEmptyString(b.sesionCajaId, "sesionCajaId"),
  };
}

export function parseWithdraw(body: unknown): WithdrawDto {
  if (!body || typeof body !== "object") {
    throw new Error("El cuerpo de la petición es inválido");
  }
  const b = body as Record<string, unknown>;
  return {
    monto: requirePositiveNumber(b.monto, "monto"),
    motivo: optionalString(b.motivo),
    sesionCajaId: requireNonEmptyString(b.sesionCajaId, "sesionCajaId"),
  };
}