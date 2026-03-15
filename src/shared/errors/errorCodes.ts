// src/shared/errors/errorCodes.ts

/**
 * Códigos de error globales del sistema.
 * Cada módulo puede definir sus propios códigos específicos,
 * pero estos son compartidos por toda la aplicación.
 */
export const ErrorCodes = {
  // General
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  NOT_FOUND: "NOT_FOUND",

  // Auth
  UNAUTHENTICATED: "UNAUTHENTICATED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_TOKEN: "INVALID_TOKEN",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
