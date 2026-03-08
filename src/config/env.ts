import dotenv from 'dotenv';

dotenv.config();

type NodeEnv = 'development' | 'production' | 'test';


function readRequired(name: string): string {
    const value = process.env[name]?.trim();

    if(!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
}

function readBoolean(name: string, fallback: boolean): boolean {
    const raw = process.env[name]?.trim().toLowerCase();

    if(!raw) return fallback;

    if(["true","1","yes", "y", "on"].includes(raw)) {
        return true;
    }
    if(["false","0","no", "n", "off"].includes(raw)) {
        return false;
    }

    throw new Error(`Invalid boolean value for environment variable ${name}: ${raw}`);
}

function readPositiveInt(name: string, fallback: number): number {
    const raw = process.env[name]?.trim();

    if(!raw) return fallback;

    const value = Number(raw);

    if(!Number.isInteger(value) || value <= 0) {
        throw new Error(`Invalid positive integer value for environment variable ${name}: ${raw}`);
    }
    return value;
}

const nodeEnv = (process.env.NODE_ENV?.trim() ?? "development") as NodeEnv;
const port = readPositiveInt("PORT", 3000);

export const env = {
  nodeEnv,
  port,
  databaseUrl: readRequired("DATABASE_URL"),
  dbSsl: readBoolean("DB_SSL", true),
  dbPoolMax: readPositiveInt("DB_POOL_MAX", 10),
  dbIdleTimeoutMs: readPositiveInt("DB_IDLE_TIMEOUT_MS", 10_000),
  dbConnectionTimeoutMs: readPositiveInt("DB_CONNECTION_TIMEOUT_MS", 10_000),
  jwtSecret: readRequired("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN?.trim() || "1h",
  allowBootstrap: readBoolean("ALLOW_BOOTSTRAP", false),
} as const;



