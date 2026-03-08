import { Router } from "express";
import { AuthController } from "./auth.controller";
import { PgAuthUserRepository } from "./auth.postgres-repository";
import { AuthService } from "./auth.service";
import { BcryptPasswordService } from "./auth.password-service";
import { JwtTokenService } from "./auth.token-service";
import { env } from "../../src/config/env";
import { SignOptions } from "jsonwebtoken";

const router = Router();

const usersRepo = new PgAuthUserRepository();
const passwordService = new BcryptPasswordService();
const tokenService = new JwtTokenService({
  secret: env.jwtSecret,
  expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
});

const authService = new AuthService(usersRepo, passwordService, tokenService);
const authController = new AuthController(authService);

router.post("/login", authController.login);

export default router;