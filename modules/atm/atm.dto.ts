// modules/atm/atm.dto.ts

export interface AtmRecord {
  id: string;
  sucursalId: string;
  sucursalCodigo?: string | null;
  sucursalNombre?: string | null;
  cajaId: string;
  cajaCodigo?: string | null;
  cajaNombre?: string | null;
  codigo: string;
  nombre: string;
  estado: string;
  moneda: string;
  limiteOperativo: number;
  balanceActual: number;
  totalOperativo: number;
}

export interface CreateAtmDto {
  sucursalId: string;
  cajaId: string;
  codigo?: string;
  nombre: string;
  balanceInicial: number;
  moneda?: string;
  estado?: string;
}

export interface AtmOperationDto {
  monto: number;
  sesionCajaId: string;
  referencia?: string;
  observacion?: string;
  sucursalId?: string;
  cajaId?: string;
}

export interface DepositDto extends AtmOperationDto {}

export interface WithdrawDto extends AtmOperationDto {}

export interface AtmMovimientoRecord {
  id: string;
  fecha: string;
  tipo: string;
  tipoMovimiento: "REABASTECIMIENTO" | "RETIRO";
  medio: string;
  monto: number;
  moneda: string;
  referencia: string | null;
  observacion: string | null;
  estado: string;
  usuarioId: string;
  usuarioNombre: string | null;
  sesionCajaId: string;
  cajaId: string;
  cajaCodigo: string | null;
  atmId: string;
  atmCodigo: string;
  atmNombre: string;
  sucursalId: string;
  sucursalCodigo: string;
  sucursalNombre: string;
}

export interface AtmOperationResult {
  atm: AtmRecord;
  movimiento: AtmMovimientoRecord;
  sucursalTotal: number;
}

function requirePositiveNumber(value: unknown, field: string): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    throw new Error(`"${field}" debe ser un número positivo`);
  }
  return num;
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`"${field}" es requerido y no puede estar vacío`);
  }
  return value.trim();
}

function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new Error(`"${field}" debe ser texto`);
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseOperation(body: unknown): AtmOperationDto {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("El cuerpo de la petición es inválido");
  }

  const payload = body as Record<string, unknown>;

  return {
    monto: requirePositiveNumber(payload.monto, "monto"),
    sesionCajaId: requireNonEmptyString(payload.sesionCajaId, "sesionCajaId"),
    referencia: optionalString(payload.referencia, "referencia"),
    observacion: optionalString(payload.observacion, "observacion"),
    sucursalId: optionalString(payload.sucursalId, "sucursalId"),
    cajaId: optionalString(payload.cajaId, "cajaId"),
  };
}

export function parseCreateAtm(body: unknown): CreateAtmDto {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("El cuerpo de la petición es inválido");
  }

  const payload = body as Record<string, unknown>;

  return {
    sucursalId: requireNonEmptyString(payload.sucursalId, "sucursalId"),
    cajaId: requireNonEmptyString(payload.cajaId, "cajaId"),
    codigo: optionalString(payload.codigo, "codigo")?.trim().toUpperCase(),
    nombre: requireNonEmptyString(payload.nombre, "nombre"),
    balanceInicial: requirePositiveNumber(payload.balanceInicial, "balanceInicial"),
    moneda: optionalString(payload.moneda, "moneda")?.toUpperCase(),
    estado: optionalString(payload.estado, "estado")?.toUpperCase(),
  };
}

export function parseDeposit(body: unknown): DepositDto {
  return parseOperation(body);
}

export function parseWithdraw(body: unknown): WithdrawDto {
  return parseOperation(body);
}
