// modules/cashboxes/cashboxes.dto.ts

export type CashboxStatus = "ACTIVA" | "INACTIVA" | "EN_MANTENIMIENTO";

export type CashboxRecord = {
  id: string;
  sucursalId: string;
  codigo: string;
  nombre: string;
  estado: CashboxStatus;
  moneda: string;
  limiteOperativo: number;
};

export type CreateCashboxDto = {
  sucursalId: string;
  codigo: string;
  nombre: string;
  estado?: CashboxStatus;
  moneda?: string;
  limiteOperativo?: number;
};

export type UpdateCashboxDto = {
  sucursalId?: string;
  codigo?: string;
  nombre?: string;
  estado?: CashboxStatus;
  moneda?: string;
  limiteOperativo?: number;
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

function optionalNonEmptyString(
  value: unknown,
  field: string
): string | undefined {
  if (value === undefined) return undefined;
  return requireNonEmptyString(value, field);
}

const VALID_STATUSES: CashboxStatus[] = ["ACTIVA", "INACTIVA", "EN_MANTENIMIENTO"];

function parseStatus(value: unknown, field: string): CashboxStatus {
  const raw = requireNonEmptyString(value, field).toUpperCase();

  if (!VALID_STATUSES.includes(raw as CashboxStatus)) {
    throw new Error(`${field} debe ser ACTIVA, INACTIVA o EN_MANTENIMIENTO`);
  }

  return raw as CashboxStatus;
}

function optionalPositiveNumber(
  value: unknown,
  field: string
): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || value < 0) {
    throw new Error(`${field} debe ser un número positivo`);
  }
  return value;
}

export function parseCreateCashbox(input: unknown): CreateCashboxDto {
  const body = requireObject(input);

  return {
    sucursalId: requireNonEmptyString(body.sucursalId, "sucursalId"),
    codigo: requireNonEmptyString(body.codigo, "codigo").toUpperCase(),
    nombre: requireNonEmptyString(body.nombre, "nombre"),
    estado: body.estado !== undefined
      ? parseStatus(body.estado, "estado")
      : undefined,
    moneda: optionalNonEmptyString(body.moneda, "moneda")?.toUpperCase(),
    limiteOperativo: optionalPositiveNumber(
      body.limiteOperativo,
      "limiteOperativo"
    ),
  };
}

export function parseUpdateCashbox(input: unknown): UpdateCashboxDto {
  const body = requireObject(input);
  const result: UpdateCashboxDto = {};

  const sucursalId = optionalNonEmptyString(body.sucursalId, "sucursalId");
  if (sucursalId !== undefined) result.sucursalId = sucursalId;

  const codigo = optionalNonEmptyString(body.codigo, "codigo");
  if (codigo !== undefined) result.codigo = codigo.toUpperCase();

  const nombre = optionalNonEmptyString(body.nombre, "nombre");
  if (nombre !== undefined) result.nombre = nombre;

  if ("estado" in body && body.estado !== undefined) {
    result.estado = parseStatus(body.estado, "estado");
  }

  const moneda = optionalNonEmptyString(body.moneda, "moneda");
  if (moneda !== undefined) result.moneda = moneda.toUpperCase();

  const limiteOperativo = optionalPositiveNumber(
    body.limiteOperativo,
    "limiteOperativo"
  );
  if (limiteOperativo !== undefined) result.limiteOperativo = limiteOperativo;

  if (Object.keys(result).length === 0) {
    throw new Error("Debes enviar al menos un campo para actualizar");
  }

  return result;
}
