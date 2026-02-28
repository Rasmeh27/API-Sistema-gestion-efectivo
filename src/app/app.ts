// src/app/app.ts
import express, { Request, Response, NextFunction } from "express";
import http from "http";
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

  // Si estás detrás de proxy (NGINX/Cloudflare), esto evita problemas con IP/https detection:
  // app.set("trust proxy", 1);

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  // TODO (cuando lo instales): cors, helmet, rate limit, compression, request logging, etc.
}

function configureRoutes(app: express.Express): void {
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // API routes
  app.use("/api", appRoutes);

  // 404
  app.use((_req, _res, next) => {
    next(new AppError("Not Found", 404));
  });
}

function configureErrorHandling(app: express.Express): void {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const env = (process.env.NODE_ENV ?? "development") as NodeEnv;

    const safeError =
      err instanceof AppError
        ? err
        : new AppError("Internal Server Error", 500, false);

    const payload =
      env === "production"
        ? { message: safeError.statusCode === 500 ? "Internal Server Error" : safeError.message }
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
  const shutdown = (signal: string) => {
    // 1) Deja de aceptar nuevas conexiones
    server.close(() => {
      // 2) Aquí puedes cerrar DB, colas, redis, etc.
      // await db.close() (si lo tienes)
      process.exit(0);
    });

    // 3) Safety timeout: si algo se queda colgado, forzamos salida
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  process.on("unhandledRejection", (reason) => {
    // En producción normalmente conviene tumbar el proceso para evitar estado corrupto
    // y dejar que el orchestrator (pm2/docker/k8s) lo reinicie.
    // Log mínimo:
    // eslint-disable-next-line no-console
    console.error("Unhandled Rejection:", reason);
    shutdown("unhandledRejection");
  });

  process.on("uncaughtException", (error) => {
    // eslint-disable-next-line no-console
    console.error("Uncaught Exception:", error);
    shutdown("uncaughtException");
  });
}

export function startServer(): http.Server {
  const { port, env } = getServerConfig();
  const app = createApp();

  const server = http.createServer(app);

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] listening on port ${port} (${env})`);
  });

  setupProcessHandlers(server);
  return server;
}