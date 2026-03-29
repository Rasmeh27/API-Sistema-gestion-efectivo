// modules/sucursales/sucursales.routes.ts

import { Router } from "express";
import { SucursalesController } from "./sucursales.controller";
import { SucursalesService } from "./sucursales.service";
import { PgSucursalRepository } from "./sucursales.postgres-repository";
import { requirePermission } from "../../src/middlewares/rbac.middleware";
import { Resources, Actions } from "../../src/config/rbac";

// ── Dependencias ────────────────────────────────────────

const repository = new PgSucursalRepository();
const service = new SucursalesService(repository);
const controller = new SucursalesController(service);

// ── Rutas ───────────────────────────────────────────────

const router = Router();

router.post(
  "/",
  requirePermission(Resources.SUCURSALES, Actions.CREAR),
  controller.create
);

router.get(
  "/",
  requirePermission(Resources.SUCURSALES, Actions.VER),
  controller.list
);

router.get(
  "/:id",
  requirePermission(Resources.SUCURSALES, Actions.VER),
  controller.getById
);

router.patch(
  "/:id",
  requirePermission(Resources.SUCURSALES, Actions.EDITAR),
  controller.update
);

router.delete(
  "/:id",
  requirePermission(Resources.SUCURSALES, Actions.ELIMINAR),
  controller.delete
);

router.get(
  "/:id/atms",
  requirePermission(Resources.SUCURSALES, Actions.VER),
  controller.listAtms
);

export default router;
