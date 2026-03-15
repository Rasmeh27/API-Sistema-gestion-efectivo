// src/middlewares/error.middleware.ts

import { NextFunction, Request, Response } from "express";
import { AppError } from "../shared/errors/AppError";
import { env } from "../config/env";

/**
 * Middleware global de manejo de errores.
 * Debe registrarse como el último middleware en Express.
 */
export function globalErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const appError = toAppError(err);

  logError(appError, err);

  const payload = env.isProduction
    ? buildProductionPayload(appError)
    : buildDevelopmentPayload(appError, err);

  res.status(appError.statusCode).json({ error: payload });
}

function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;

  if (err instanceof SyntaxError && "body" in err) {
    return AppError.badRequest("JSON inválido en el cuerpo de la solicitud");
  }

  return AppError.internal();
}

function logError(appError: AppError, originalError: unknown): void {
  if (!appError.isOperational) {
    console.error("[ERROR NO OPERACIONAL]", originalError);
  }
}

function buildProductionPayload(error: AppError) {
  return {
    code: "INTERNAL_ERROR",
    message:
      error.statusCode === 500
        ? "Error interno del servidor"
        : error.message,
  };
}

function buildDevelopmentPayload(error: AppError, originalError: unknown) {
  return {
    code: "INTERNAL_ERROR",
    message: error.message,
    statusCode: error.statusCode,
    stack:
      originalError instanceof Error
        ? originalError.stack
        : undefined,
  };
}
