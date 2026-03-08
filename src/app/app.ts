import express, { NextFunction, Request, Response } from "express";
import http from "http";
import { closeDatabase, pingDatabase } from "../../db";
import appRoutes from "./routes";

type NodeEnv = "development" | "test" | "production";

interface ServerConfig {
  port: number;
  env: NodeEnv;
}

class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
  }
}

function getServerConfig(): ServerConfig {
  const env = (process.env.NODE_ENV ?? "development") as NodeEnv;
  const rawPort = process.env.PORT ?? "3000";

  const port = Number(rawPort);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  return { port, env };
}

function configureMiddleware(app: express.Express): void {
  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
}

function configureRoutes(app: express.Express): void {
  app.get("/health", async (_req, res, next) => {
    try {
      await pingDatabase();

      return res.status(200).json({
        status: "ok",
        database: "up",
      });
    } catch (_error) {
      return next(new AppError("Database unavailable", 503, false));
    }
  });

  app.use("/api", appRoutes);

  app.use((_req, _res, next) => {
    next(new AppError("Not Found", 404));
  });
}

function configureErrorHandling(app: express.Express): void {
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const env = (process.env.NODE_ENV ?? "development") as NodeEnv;
    const safeError =
      err instanceof AppError ? err : new AppError("Internal Server Error", 500, false);

    const payload =
      env === "production"
        ? {
            message: safeError.statusCode === 500 ? "Internal Server Error" : safeError.message,
          }
        : {
            message: safeError.message,
            statusCode: safeError.statusCode,
            stack: err instanceof Error ? err.stack : undefined,
          };

    res.status(safeError.statusCode).json(payload);
  });
}

export function createApp(): express.Express {
  const app = express();

  configureMiddleware(app);
  configureRoutes(app);
  configureErrorHandling(app);

  return app;
}

function setupProcessHandlers(server: http.Server): void {
  const shutdown = () => {
    server.close(async () => {
      try {
        await closeDatabase();
        process.exit(0);
      } catch (error) {
        console.error("Error closing database during shutdown:", error);
        process.exit(1);
      }
    });

    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled Rejection:", reason);
    shutdown();
  });
  process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    shutdown();
  });
}

export function startServer(): http.Server {
  const { port, env } = getServerConfig();
  const app = createApp();
  const server = http.createServer(app);

  server.listen(port, () => {
    console.log(`[server] listening on port ${port} (${env})`);
  });

  setupProcessHandlers(server);

  return server;
}