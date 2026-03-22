// modules/cashbox-audits/cashbox-audits.routes.ts

import { Router } from "express";
import { CashboxAuditsController } from "./cashbox-audits.controller";
import { CashboxAuditsService } from "./cashbox-audits.service";
import { PgCashboxAuditRepository } from "./cashbox-audits.postgres-repository";
import { PgCashboxSessionRepository } from "../cashbox-sessions/cashbox-sessions.postgres-repository";
import { PgCashMovementRepository } from "../cash-movements/cash-movements.postgres-repository";
import { PgAuditRepository } from "../audit/audit.postgres-repository";
import { AuditLogger } from "../audit/audit.logger";
import { requirePermission } from "../../src/middlewares/rbac.middleware";
import { Resources, Actions } from "../../src/config/rbac";

// ── Dependencias ────────────────────────────────────────

const auditRepository = new PgCashboxAuditRepository();
const sessionRepository = new PgCashboxSessionRepository();
const movementRepository = new PgCashMovementRepository();
const auditLogger = new AuditLogger(new PgAuditRepository());
const service = new CashboxAuditsService(
  auditRepository,
  sessionRepository,
  movementRepository,
  auditLogger
);
const controller = new CashboxAuditsController(service);

// ── Rutas ───────────────────────────────────────────────

const router = Router();

router.post(
  "/",
  requirePermission(Resources.ARQUEOS, Actions.CREAR),
  controller.create
);

router.get(
  "/",
  requirePermission(Resources.ARQUEOS, Actions.VER),
  controller.list
);

router.get(
  "/:id",
  requirePermission(Resources.ARQUEOS, Actions.VER),
  controller.getById
);

export default router;
