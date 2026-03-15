// src/config/env.ts

import dotenv from "dotenv";

dotenv.config();

// ── Tipos ───────────────────────────────────────────────

type NodeEnv = "development" | "production" | "test";

// ── Lectores de variables de entorno ────────────────────

function readRequired(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Variable de entorno requerida no encontrada: ${name}`);
  }

  return value;
}

function readOptional(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

function readBoolean(name: string, fallback: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();

  if (!raw) return fallback;

  const truthy = ["true", "1", "yes", "y", "on"];
  const falsy = ["false", "0", "no", "n", "off"];

  if (truthy.includes(raw)) return true;
  if (falsy.includes(raw)) return false;

  throw new Error(
    `Valor booleano inválido para ${name}: "${raw}"`
  );
}

function readPositiveInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();

  if (!raw) return fallback;

  const value = Number(raw);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(
      `Entero positivo inválido para ${name}: "${raw}"`
    );
  }

  return value;
}

// ── Validación de NodeEnv ───────────────────────────────

function readNodeEnv(): NodeEnv {
  const raw = process.env.NODE_ENV?.trim() ?? "development";
  const valid: NodeEnv[] = ["development", "production", "test"];

  if (!valid.includes(raw as NodeEnv)) {
    throw new Error(
      `NODE_ENV inválido: "${raw}". Valores permitidos: ${valid.join(", ")}`
    );
  }

  return raw as NodeEnv;
}

// ── Exportación ─────────────────────────────────────────

export const env = {
  // Server
  nodeEnv: readNodeEnv(),
  port: readPositiveInt("PORT", 3000),
  isProduction: readNodeEnv() === "production",
  isDevelopment: readNodeEnv() === "development",

  // Database
  databaseUrl: readRequired("DATABASE_URL"),
  dbSsl: readBoolean("DB_SSL", true),
  dbPoolMax: readPositiveInt("DB_POOL_MAX", 10),
  dbIdleTimeoutMs: readPositiveInt("DB_IDLE_TIMEOUT_MS", 10_000),
  dbConnectionTimeoutMs: readPositiveInt("DB_CONNECTION_TIMEOUT_MS", 10_000),

  // JWT / Auth
  jwtSecret: readRequired("JWT_SECRET"),
  jwtExpiresIn: readOptional("JWT_EXPIRES_IN", "15m"),
  jwtRefreshExpiresDays: readPositiveInt("JWT_REFRESH_EXPIRES_DAYS", 7),

  // Feature flags
  allowBootstrap: readBoolean("ALLOW_BOOTSTRAP", false),
} as const;
