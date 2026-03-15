// src/shared/utils/money.ts

const DEFAULT_CURRENCY = "DOP";
const DECIMAL_PLACES = 2;

/**
 * Redondea un monto a 2 decimales (centavos).
 */
export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Valida que un monto sea positivo.
 */
export function isPositiveAmount(amount: number): boolean {
  return typeof amount === "number" && isFinite(amount) && amount > 0;
}

/**
 * Valida que un monto sea no-negativo (>= 0).
 */
export function isNonNegativeAmount(amount: number): boolean {
  return typeof amount === "number" && isFinite(amount) && amount >= 0;
}

/**
 * Formatea un monto como string con 2 decimales.
 */
export function formatMoney(
  amount: number,
  currency: string = DEFAULT_CURRENCY
): string {
  return `${currency} ${roundMoney(amount).toFixed(DECIMAL_PLACES)}`;
}

/**
 * Calcula la diferencia entre dos montos.
 */
export function moneyDifference(expected: number, actual: number): number {
  return roundMoney(actual - expected);
}

export { DEFAULT_CURRENCY };
