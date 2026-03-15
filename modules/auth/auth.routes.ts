// modules/auth/auth.routes.ts

import { Router } from "express";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PgAuthUserRepository } from "./auth.postgres-repository";
import { PgAuthSessionRepository } from "./auth.session-postgres-repository";
import { BcryptPasswordService } from "./auth.password-service";
import { JwtTokenService } from "./auth.token-service";
import { requireAuth } from "../../src/middlewares/auth.middleware";
import { env } from "../../src/config/env";

// ── Dependencias ────────────────────────────────────────

const userRepository = new PgAuthUserRepository();
const sessionRepository = new PgAuthSessionRepository();
const passwordService = new BcryptPasswordService();

const tokenService = new JwtTokenService({
  secret: env.jwtSecret,
  accessExpiresIn: env.jwtExpiresIn,
  refreshExpiresInDays: 7,
});

const authService = new AuthService(
  userRepository,
  passwordService,
  tokenService,
  sessionRepository
);

const controller = new AuthController(authService);

// ── Rutas ───────────────────────────────────────────────

const router = Router();

router.post("/login", controller.login);
router.post("/refresh", controller.refresh);
router.post("/logout", controller.logout);
router.post("/logout-all", requireAuth, controller.logoutAll);

export default router;
