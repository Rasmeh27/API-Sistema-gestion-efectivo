// modules/roles/roles.routes.ts

import { Router } from "express";
import { RolesController } from "./roles.controller";
import { RolesService } from "./roles.service";
import { PgRoleRepository } from "./roles.postgres-repository";
import { PgAuditRepository } from "../audit/audit.postgres-repository";
import { AuditLogger } from "../audit/audit.logger";
import { requirePermission } from "../../src/middlewares/rbac.middleware";
import { Resources, Actions } from "../../src/config/rbac";

// ── Dependencias ────────────────────────────────────────

const repository = new PgRoleRepository();
const auditLogger = new AuditLogger(new PgAuditRepository());
const service = new RolesService(repository, auditLogger);
const controller = new RolesController(service);

// ── Rutas ───────────────────────────────────────────────

const router = Router();

router.post(
  "/",
  requirePermission(Resources.ROLES, Actions.CREAR),
  controller.create
);

router.get(
  "/",
  requirePermission(Resources.ROLES, Actions.VER),
  controller.list
);

router.get(
  "/:id",
  requirePermission(Resources.ROLES, Actions.VER),
  controller.getById
);

router.patch(
  "/:id",
  requirePermission(Resources.ROLES, Actions.EDITAR),
  controller.update
);

router.delete(
  "/:id",
  requirePermission(Resources.ROLES, Actions.ELIMINAR),
  controller.delete
);

export default router;
