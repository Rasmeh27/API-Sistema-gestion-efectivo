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
  telefono: string | null;
  direccion: string | null;
  cantidadAtm: number;
};

export type CreateSucursalDto = {
  codigo?: string;
  nombre: string;
  estado?: SucursalStatus;
  latitud?: number;
  longitud?: number;
  telefono?: string;
  direccion?: string;
};

export type UpdateSucursalDto = {
  codigo?: string;
  nombre?: string;
  estado?: SucursalStatus;
  latitud?: number | null;
  longitud?: number | null;
  telefono?: string | null;
  direccion?: string | null;
};

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
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new Error(`${field} debe ser un string`);
  }
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed;
}

function requireOptionalNonEmptyString(
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

function parseCoordinate(
  value: unknown,
  field: "latitud" | "longitud"
): number {
  const num = Number(value);

  if (!Number.isFinite(num)) {
    throw new Error(`${field} debe ser un número válido`);
  }

  if (field === "latitud" && (num < -90 || num > 90)) {
    throw new Error("latitud debe estar entre -90 y 90");
  }

  if (field === "longitud" && (num < -180 || num > 180)) {
    throw new Error("longitud debe estar entre -180 y 180");
  }

  return num;
}

function optionalCoordinate(
  value: unknown,
  field: "latitud" | "longitud"
): number | undefined {
  if (value === undefined || value === null) return undefined;
  return parseCoordinate(value, field);
}

function validateCoordinatePair(data: {
  latitud?: number | null;
  longitud?: number | null;
}): void {
  const hasLatitud = data.latitud !== undefined && data.latitud !== null;
  const hasLongitud = data.longitud !== undefined && data.longitud !== null;

  if (hasLatitud !== hasLongitud) {
    throw new Error(
      "latitud y longitud deben enviarse juntas para ubicar la sucursal en el mapa"
    );
  }
}

function parsePhone(value: unknown, field: string): string {
  const phone = requireNonEmptyString(value, field);

  if (!/^[0-9+()\-\s]{7,20}$/.test(phone)) {
    throw new Error(`${field} tiene un formato inválido`);
  }

  return phone;
}

function optionalPhone(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined;
  return parsePhone(value, field);
}

export function generateCodePrefix(nombre: string): string {
  const cleaned = nombre.replace(/sucursal/gi, "").trim().toUpperCase();
  const letters = cleaned.replace(/[^A-Z]/g, "");
  const prefix = (letters.slice(0, 3) || "SUC").padEnd(3, "X");
  return prefix;
}

export function parseCreateSucursal(input: unknown): CreateSucursalDto {
  const body = requireObject(input);

  const result: CreateSucursalDto = {
    codigo: optionalNonEmptyString(body.codigo, "codigo")?.toUpperCase(),
    nombre: requireNonEmptyString(body.nombre, "nombre"),
    estado:
      body.estado !== undefined
        ? parseStatus(body.estado, "estado")
        : undefined,
    latitud: optionalCoordinate(body.latitud, "latitud"),
    longitud: optionalCoordinate(body.longitud, "longitud"),
    telefono: optionalPhone(body.telefono, "telefono"),
    direccion: optionalNonEmptyString(body.direccion, "direccion"),
  };

  validateCoordinatePair(result);

  return result;
}

export function parseUpdateSucursal(input: unknown): UpdateSucursalDto {
  const body = requireObject(input);
  const result: UpdateSucursalDto = {};

  const codigo = requireOptionalNonEmptyString(body.codigo, "codigo");
  if (codigo !== undefined) {
    result.codigo = codigo.toUpperCase();
  }

  const nombre = requireOptionalNonEmptyString(body.nombre, "nombre");
  if (nombre !== undefined) {
    result.nombre = nombre;
  }

  if ("estado" in body && body.estado !== undefined) {
    result.estado = parseStatus(body.estado, "estado");
  }

  if ("latitud" in body) {
    result.latitud =
      body.latitud === null ? null : parseCoordinate(body.latitud, "latitud");
  }

  if ("longitud" in body) {
    result.longitud =
      body.longitud === null
        ? null
        : parseCoordinate(body.longitud, "longitud");
  }

  if ("telefono" in body) {
    result.telefono =
      body.telefono === null ? null : parsePhone(body.telefono, "telefono");
  }

  if ("direccion" in body) {
    result.direccion =
      body.direccion === null
        ? null
        : requireNonEmptyString(body.direccion, "direccion");
  }

  if (Object.keys(result).length === 0) {
    throw new Error("Debes enviar al menos un campo para actualizar");
  }

  return result;
}
