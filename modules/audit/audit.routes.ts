// modules/audit/audit.routes.ts

import { Router } from "express";
import { AuditController } from "./audit.controller";
import { AuditService } from "./audit.service";
import { PgAuditRepository } from "./audit.postgres-repository";
import { requirePermission } from "../../src/middlewares/rbac.middleware";
import { Resources, Actions } from "../../src/config/rbac";

// ── Dependencias ────────────────────────────────────────

const repository = new PgAuditRepository();
const service = new AuditService(repository);
const controller = new AuditController(service);

// ── Rutas ───────────────────────────────────────────────

const router = Router();

router.post(
  "/",
  requirePermission(Resources.AUDITORIA, Actions.CREAR),
  controller.create
);

router.get(
  "/",
  requirePermission(Resources.AUDITORIA, Actions.VER),
  controller.list
);

router.get(
  "/:id",
  requirePermission(Resources.AUDITORIA, Actions.VER),
  controller.getById
);

export default router;
