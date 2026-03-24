// modules/sucursales/sucursales.dto.ts

export type SucursalStatus = "ACTIVA" | "INACTIVA";

export type SucursalRecord = {
  id: string;
  codigo: string;
  nombre: string;
  estado: SucursalStatus;
  total: number;
  latitud: number | null;
  longitud: number | null;
};

export type CreateSucursalDto = {
  codigo: string;
  nombre: string;
  estado?: SucursalStatus;
  latitud?: number;
  longitud?: number;
};

export type UpdateSucursalDto = {
  codigo?: string;
  nombre?: string;
  estado?: SucursalStatus;
  latitud?: number | null;
  longitud?: number | null;
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

const VALID_STATUSES: SucursalStatus[] = ["ACTIVA", "INACTIVA"];

function parseStatus(value: unknown, field: string): SucursalStatus {
  const raw = requireNonEmptyString(value, field).toUpperCase();

  if (!VALID_STATUSES.includes(raw as SucursalStatus)) {
    throw new Error(`${field} debe ser ACTIVA o INACTIVA`);
  }

  return raw as SucursalStatus;
}

function optionalNumber(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null) return undefined;
  const num = Number(value);
  if (isNaN(num)) throw new Error(`${field} debe ser un número válido`);
  return num;
}

export function parseCreateSucursal(input: unknown): CreateSucursalDto {
  const body = requireObject(input);

  return {
    codigo: requireNonEmptyString(body.codigo, "codigo").toUpperCase(),
    nombre: requireNonEmptyString(body.nombre, "nombre"),
    estado: body.estado !== undefined
      ? parseStatus(body.estado, "estado")
      : undefined,
    latitud: optionalNumber(body.latitud, "latitud"),
    longitud: optionalNumber(body.longitud, "longitud"),
  };
}

export function parseUpdateSucursal(input: unknown): UpdateSucursalDto {
  const body = requireObject(input);
  const result: UpdateSucursalDto = {};

  const codigo = optionalNonEmptyString(body.codigo, "codigo");
  if (codigo !== undefined) {
    result.codigo = codigo.toUpperCase();
  }

  const nombre = optionalNonEmptyString(body.nombre, "nombre");
  if (nombre !== undefined) {
    result.nombre = nombre;
  }

  if ("estado" in body && body.estado !== undefined) {
    result.estado = parseStatus(body.estado, "estado");
  }

  if ("latitud" in body) {
    result.latitud = body.latitud === null ? null : optionalNumber(body.latitud, "latitud") ?? null;
  }

  if ("longitud" in body) {
    result.longitud = body.longitud === null ? null : optionalNumber(body.longitud, "longitud") ?? null;
  }

  if (Object.keys(result).length === 0) {
    throw new Error("Debes enviar al menos un campo para actualizar");
  }

  return result;
}
