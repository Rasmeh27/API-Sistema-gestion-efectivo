// Tipo único para estado
export type TreasuryStatus = "ACTIVA" | "INACTIVA";

export type TreasuryRecord = {
  id: string;
  codigo: string;
  nombre: string;
  estado: TreasuryStatus;
};

export type CreateTreasuryDto = {
  codigo: string;
  nombre: string;
  estado?: TreasuryStatus;
};

export type UpdateTreasuryDto = {
  codigo?: string;
  nombre?: string;
  estado?: TreasuryStatus;
};

// Helpers
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

function normalizeStatus(value: unknown, fieldName: string): TreasuryStatus {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} debe ser un string`);
  }
  const normalized = value.trim().toUpperCase();
  if (normalized !== "ACTIVA" && normalized !== "INACTIVA") {
    throw new Error(`${fieldName} debe ser ACTIVA o INACTIVA`);
  }
  return normalized as TreasuryStatus;
}

// Parsers
export function parseCreateTreasury(input: unknown): CreateTreasuryDto {
  const payload = requireObject(input);
  return {
    codigo: normalizeString(payload.codigo, "codigo").toUpperCase(),
    nombre: normalizeString(payload.nombre, "nombre"),
    estado: payload.estado ? normalizeStatus(payload.estado, "estado") : "ACTIVA",
  };
}

export function parseUpdateTreasury(input: unknown): UpdateTreasuryDto {
  const payload = requireObject(input);
  const result: UpdateTreasuryDto = {};

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