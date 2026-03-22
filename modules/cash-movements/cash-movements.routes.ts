// modules/cash-movements/cash-movements.routes.ts

import { Router } from "express";
import { CashMovementsController } from "./cash-movements.controller";
import { CashMovementsService } from "./cash-movements.service";
import { PgCashMovementRepository } from "./cash-movements.postgres-repository";
import { PgCashboxSessionRepository } from "../cashbox-sessions/cashbox-sessions.postgres-repository";
import { PgCashboxRepository } from "../cashboxes/cashboxes.postgres-repository";
import { PgAuditRepository } from "../audit/audit.postgres-repository";
import { AuditLogger } from "../audit/audit.logger";
import { requirePermission } from "../../src/middlewares/rbac.middleware";
import { Resources, Actions } from "../../src/config/rbac";

// ── Dependencias ────────────────────────────────────────

const movementRepo = new PgCashMovementRepository();
const sessionRepo = new PgCashboxSessionRepository();
const cashboxRepo = new PgCashboxRepository();
const auditLogger = new AuditLogger(new PgAuditRepository());
const service = new CashMovementsService(movementRepo, sessionRepo, cashboxRepo, auditLogger);
const controller = new CashMovementsController(service);

// ── Rutas ───────────────────────────────────────────────

const router = Router();

router.post(
  "/",
  requirePermission(Resources.MOVIMIENTOS, Actions.CREAR),
  controller.create
);

router.get(
  "/",
  requirePermission(Resources.MOVIMIENTOS, Actions.VER),
  controller.list
);

router.get(
  "/:id",
  requirePermission(Resources.MOVIMIENTOS, Actions.VER),
  controller.getById
);

router.patch(
  "/:id/void",
  requirePermission(Resources.MOVIMIENTOS, Actions.EDITAR),
  controller.void
);

export default router;
