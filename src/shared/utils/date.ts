// src/shared/utils/date.ts

/**
 * Agrega días a una fecha dada.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Agrega horas a una fecha dada.
 */
export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setTime(result.getTime() + hours * 60 * 60 * 1000);
  return result;
}

/**
 * Agrega minutos a una fecha dada.
 */
export function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setTime(result.getTime() + minutes * 60 * 1000);
  return result;
}

/**
 * Verifica si una fecha ya expiró respecto a "ahora".
 */
export function isExpired(date: Date): boolean {
  return date.getTime() < Date.now();
}

/**
 * Retorna la fecha actual en formato ISO sin milisegundos.
 */
export function nowISO(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}
