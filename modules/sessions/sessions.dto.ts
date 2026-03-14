export type CreateSessionDto = {
  userId: string;
  token: string;
  expiresAt: Date;
};

export type UpdateSessionDto = {
  token?: string;
  expiresAt?: Date;
};

export type SessionRecord = {
  id: string;
  userId: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
};

// Helpers de validación
function requireObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Payload inválido");
  }
  return value as Record<string, unknown>;
}

function normalizeString(value: unknown, fieldName: string): string {
  if (typeof value !== "string") {
    throw new Error(`El campo ${fieldName} debe ser una cadena de texto`);
  }
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`El campo ${fieldName} no puede estar vacío`);
  }
  return normalized;
}

function normalizeDate(value: unknown, fieldName: string): Date {
  if (!(value instanceof Date) && typeof value !== "string") {
    throw new Error(`El campo ${fieldName} debe ser una fecha válida`);
  }
  const date = new Date(value as string);
  if (isNaN(date.getTime())) {
    throw new Error(`El campo ${fieldName} no es una fecha válida`);
  }
  return date;
}

// Parsers
export function parseCreateSession(input: unknown): CreateSessionDto {
  const payload = requireObject(input);

  return {
    userId: normalizeString(payload.userId, "userId"),
    token: normalizeString(payload.token, "token"),
    expiresAt: normalizeDate(payload.expiresAt, "expiresAt"),
  };
}

export function parseUpdateSession(input: unknown): UpdateSessionDto {
  const payload = requireObject(input);
  const result: UpdateSessionDto = {};

  if ("token" in payload && payload.token !== undefined) {
    result.token = normalizeString(payload.token, "token");
  }

  if ("expiresAt" in payload && payload.expiresAt !== undefined) {
    result.expiresAt = normalizeDate(payload.expiresAt, "expiresAt");
  }

  if (Object.keys(result).length === 0) {
    throw new Error("Al menos un campo debe ser proporcionado para actualizar la sesión");
  }

  return result;
}