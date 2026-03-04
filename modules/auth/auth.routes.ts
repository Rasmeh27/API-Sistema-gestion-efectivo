import { Router } from "express";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthUserMemoryRepository } from "./auth.memory-repository";
import { BcryptPasswordService } from "./auth.password-service";
import { JwtTokenService } from "./auth.token-service";
import dotenv from "dotenv";

dotenv.config();
const router = Router();

/**
 * Composition root del módulo Auth.
 * Aquí se cablean dependencias (repos/services).
 * La lógica de negocio NO vive aquí.
 */
const usersRepo = new AuthUserMemoryRepository([
  {
    id: "u_1",
    email: "admin@demo.com",
    // Reemplazar por hash real (ver script abajo)
    passwordHash: process.env.AUTH_SEED_ADMIN_HASH ?? "",
    roleId: ["ROLE_ADMIN"],
    status: "ACTIVO",
  },
]);

const passwordService = new BcryptPasswordService();
const tokenService = new JwtTokenService({
  secret: process.env.JWT_SECRET ?? "dev-secret",
  expiresIn: process.env.JWT_EXPIRES_IN ?? "1h",
});

const authService = new AuthService(usersRepo, passwordService, tokenService);
const authController = new AuthController(authService);

router.post("/login", authController.login);

export default router;