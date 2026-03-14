export type TransactionType = "INCOME" | "EXPENSE";

export type TransactionRecord = {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  description?: string;
  createdAt: Date;
};

export type CreateTransactionDto = {
  userId: string;
  amount: number;
  type: TransactionType;
  description?: string;
};

export type UpdateTransactionDto = {
  userId?: string;
  amount?: number;
  type?: TransactionType;
  description?: string;
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

function normalizeNumber(value: unknown, fieldName: string): number {
  if (typeof value !== "number" || isNaN(value)) {
    throw new Error(`${fieldName} debe ser un número válido`);
  }
  return value;
}

function isTransactionType(value: unknown): value is TransactionType {
  return value === "INCOME" || value === "EXPENSE";
}

function normalizeType(value: unknown, fieldName: string): TransactionType {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} debe ser un string`);
  }
  const normalized = value.trim().toUpperCase();
  if (!isTransactionType(normalized)) {
    throw new Error(`${fieldName} debe ser INCOME o EXPENSE`);
  }
  return normalized as TransactionType;
}

export function parseCreateTransaction(input: unknown): CreateTransactionDto {
  const payload = requireObject(input);

  return {
    userId: normalizeString(payload.userId, "userId"),
    amount: normalizeNumber(payload.amount, "amount"),
    type: normalizeType(payload.type, "type"),
    description: payload.description ? normalizeString(payload.description, "description") : undefined,
  };
}

export function parseUpdateTransaction(input: unknown): UpdateTransactionDto {
  const payload = requireObject(input);
  const result: UpdateTransactionDto = {};

  if ("userId" in payload && payload.userId !== undefined) {
    result.userId = normalizeString(payload.userId, "userId");
  }

  if ("amount" in payload && payload.amount !== undefined) {
    result.amount = normalizeNumber(payload.amount, "amount");
  }

  if ("type" in payload && payload.type !== undefined) {
    result.type = normalizeType(payload.type, "type");
  }

  if ("description" in payload && payload.description !== undefined) {
    result.description = normalizeString(payload.description, "description");
  }

  if (Object.keys(result).length === 0) {
    throw new Error("Debes enviar al menos un campo para actualizar");
  }

  return result;
}