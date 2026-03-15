// src/shared/errors/AppError.ts

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.isOperational = isOperational;
  }

  static badRequest(message: string): AppError {
    return new AppError(message, 400);
  }

  static unauthorized(message: string): AppError {
    return new AppError(message, 401);
  }

  static forbidden(message: string): AppError {
    return new AppError(message, 403);
  }

  static notFound(message: string = "Recurso no encontrado"): AppError {
    return new AppError(message, 404);
  }

  static conflict(message: string): AppError {
    return new AppError(message, 409);
  }

  static internal(message: string = "Error interno del servidor"): AppError {
    return new AppError(message, 500, false);
  }

  static serviceUnavailable(message: string): AppError {
    return new AppError(message, 503, false);
  }
}
