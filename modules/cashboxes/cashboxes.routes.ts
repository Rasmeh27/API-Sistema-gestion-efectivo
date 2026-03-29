// modules/cashboxes/cashboxes.routes.ts

import { Router } from "express";
import { CashboxesController } from "./cashboxes.controller";
import { CashboxesService } from "./cashboxes.service";
import { PgCashboxRepository } from "./cashboxes.postgres-repository";
import { PgUserRepository } from "../users/user.postgres-repository";
import { requirePermission } from "../../src/middlewares/rbac.middleware";
import { Resources, Actions } from "../../src/config/rbac";

// ── Dependencias ────────────────────────────────────────

const repository = new PgCashboxRepository();
const usersRepository = new PgUserRepository();
const service = new CashboxesService(repository, usersRepository);
const controller = new CashboxesController(service);

// ── Rutas ───────────────────────────────────────────────

const router = Router();

router.post(
  "/",
  requirePermission(Resources.CAJAS, Actions.CREAR),
  controller.create
);

router.get(
  "/",
  requirePermission(Resources.CAJAS, Actions.VER),
  controller.list
);

router.get(
  "/:id",
  requirePermission(Resources.CAJAS, Actions.VER),
  controller.getById
);

router.patch(
  "/:id",
  requirePermission(Resources.CAJAS, Actions.EDITAR),
  controller.update
);

router.delete(
  "/:id",
  requirePermission(Resources.CAJAS, Actions.ELIMINAR),
  controller.delete
);

export default router;
