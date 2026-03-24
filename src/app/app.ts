// src/app/app.ts

import express from "express";
import http from "http";
import { closeDatabase, pingDatabase } from "../../db";
import { AppError } from "../shared/errors/AppError";
import { globalErrorHandler } from "../middlewares/error.middleware";
import { env } from "../config/env";
import appRoutes from "./routes";
import cors from "cors";

// ── App Factory ─────────────────────────────────────────

export function createApp(): express.Express {
  const app = express();

  configureMiddleware(app);
  configureRoutes(app);
  configureErrorHandling(app);

  return app;
}

// ── Server ──────────────────────────────────────────────

export function startServer(): http.Server {
  const app = createApp();
  const server = http.createServer(app);

  server.listen(env.port, "0.0.0.0", () => {
    console.log(
      `[server] listening on port ${env.port} (${env.nodeEnv})`
    );
  });

  setupGracefulShutdown(server);

  return server;
}

// ── Configuración interna ───────────────────────────────

function configureMiddleware(app: express.Express): void {
  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          return callback(null, true);
        }

        const isAllowed = env.corsAllowedOrigins.includes(origin);

        return callback(null, isAllowed);
      },
      credentials: true,
    })
  );
}

function configureRoutes(app: express.Express): void {
  app.get("/health", async (_req, res, next) => {
    try {
      await pingDatabase();
      return res.status(200).json({ status: "ok", database: "up" });
    } catch {
      return next(AppError.serviceUnavailable("Base de datos no disponible"));
    }
  });

  app.use("/api", appRoutes);

  app.use((_req, _res, next) => {
    next(AppError.notFound("Ruta no encontrada"));
  });
}

function configureErrorHandling(app: express.Express): void {
  app.use(globalErrorHandler);
}

function setupGracefulShutdown(server: http.Server): void {
  const SHUTDOWN_TIMEOUT_MS = 10_000;

  const shutdown = () => {
    console.log("[server] shutting down...");

    server.close(async () => {
      try {
        await closeDatabase();
        console.log("[server] database closed");
        process.exit(0);
      } catch (error) {
        console.error("[server] error closing database:", error);
        process.exit(1);
      }
    });

    setTimeout(() => {
      console.error("[server] forced shutdown after timeout");
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS).unref();
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  process.on("unhandledRejection", (reason) => {
    console.error("[server] Unhandled Rejection:", reason);
    shutdown();
  });

  process.on("uncaughtException", (error) => {
    console.error("[server] Uncaught Exception:", error);
    shutdown();
  });
}