export type SucursalStatus = "ACTIVA" | "INACTIVA";

export type SucursalRecord = {
  id: string;
  codigo: string;
  nombre: string;
  estado: SucursalStatus;
};

export type CreateSucursalDto = {
  codigo: string;
  nombre: string;
  estado?: SucursalStatus;
};

export type UpdateSucursalDto = {
  codigo?: string;
  nombre?: string;
  estado?: SucursalStatus;
};

function requireObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Payload inválido");
  }

  return value as Record<string, unknown>;
}

function normalizeString(value: unknown, fieldName: string): string {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} debe ser un string`);
  }

  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${fieldName} es requerido`);
  }

  return normalized;
}

function isSucursalStatus(value: unknown): value is SucursalStatus {
  return value === "ACTIVA" || value === "INACTIVA";
}

function normalizeStatus(value: unknown, fieldName: string): SucursalStatus {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} debe ser un string`);
  }

  const normalized = value.trim().toUpperCase();

  if (!isSucursalStatus(normalized)) {
    throw new Error(`${fieldName} debe ser ACTIVA o INACTIVA`);
  }

  return normalized;
}

export function parseCreateSucursal(input: unknown): CreateSucursalDto {
  const payload = requireObject(input);

  return {
    codigo: normalizeString(payload.codigo, "codigo").toUpperCase(),
    nombre: normalizeString(payload.nombre, "nombre"),
    estado: payload.estado ? normalizeStatus(payload.estado, "estado") : "ACTIVA",
  };
}

export function parseUpdateSucursal(input: unknown): UpdateSucursalDto {
  const payload = requireObject(input);
  const result: UpdateSucursalDto = {};

  if ("codigo" in payload && payload.codigo !== undefined) {
    result.codigo = normalizeString(payload.codigo, "codigo").toUpperCase();
  }

  if ("nombre" in payload && payload.nombre !== undefined) {
    result.nombre = normalizeString(payload.nombre, "nombre");
  }

  if ("estado" in payload && payload.estado !== undefined) {
    result.estado = normalizeStatus(payload.estado, "estado");
  }

  if (Object.keys(result).length === 0) {
    throw new Error("Debes enviar al menos un campo para actualizar");
  }

  return result;
}