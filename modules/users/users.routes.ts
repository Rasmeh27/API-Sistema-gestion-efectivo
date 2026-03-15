// modules/users/users.routes.ts

import { Router } from "express";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { PgUserRepository } from "./user.postgres-repository";
import { BcryptPasswordService } from "../auth/auth.password-service";
import { requirePermission } from "../../src/middlewares/rbac.middleware";
import { Resources, Actions } from "../../src/config/rbac";

// ── Dependencias ────────────────────────────────────────

const repository = new PgUserRepository();
const passwordService = new BcryptPasswordService();
const service = new UsersService(repository, passwordService);
const controller = new UsersController(service);

// ── Rutas ───────────────────────────────────────────────

const router = Router();

router.post(
  "/",
  requirePermission(Resources.USUARIOS, Actions.CREAR),
  controller.create
);

router.get(
  "/",
  requirePermission(Resources.USUARIOS, Actions.VER),
  controller.list
);

router.get(
  "/:id",
  requirePermission(Resources.USUARIOS, Actions.VER),
  controller.getById
);

router.patch(
  "/:id",
  requirePermission(Resources.USUARIOS, Actions.EDITAR),
  controller.update
);

router.patch(
  "/:id/status",
  requirePermission(Resources.USUARIOS, Actions.EDITAR),
  controller.updateStatus
);

router.patch(
  "/:id/deactivate",
  requirePermission(Resources.USUARIOS, Actions.EDITAR),
  controller.deactivate
);

export default router;
