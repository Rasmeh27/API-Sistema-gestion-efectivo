export class SessionNotFoundError extends Error {
  constructor() {
    super("Sesion_No_Encontrada");
  }
}

export class SessionCreateError extends Error {
  constructor() {
    super("Sesion_Creacion_Fallida");
  }
}