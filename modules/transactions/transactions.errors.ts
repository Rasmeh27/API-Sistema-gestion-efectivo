export class TransactionError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
    Object.setPrototypeOf(this, TransactionError.prototype);
  }

  static notFound(id: string) {
    return new TransactionError(
      404,
      "TRANSACCION_NO_ENCONTRADA",
      `No se encontró la transacción con id ${id}`
    );
  }

  static createFailed() {
    return new TransactionError(
      400,
      "ERROR_AL_CREAR_TRANSACCION",
      "No se pudo crear la transacción"
    );
  }

  static updateFailed(id: string) {
    return new TransactionError(
      400,
      "ERROR_AL_ACTUALIZAR_TRANSACCION",
      `No se pudo actualizar la transacción con id ${id}`
    );
  }

  static deleteFailed(id: string) {
    return new TransactionError(
      400,
      "ERROR_AL_ELIMINAR_TRANSACCION",
      `No se pudo eliminar la transacción con id ${id}`
    );
  }
}