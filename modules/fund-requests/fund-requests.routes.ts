// modules/fund-requests/fund-requests.routes.ts

import { Router } from "express";
import { FundRequestsController } from "./fund-requests.controller";
import { FundRequestsService } from "./fund-requests.service";
import { PgFundRequestRepository } from "./fund-requests.postgres-repository";
import { PgCashMovementRepository } from "../cash-movements/cash-movements.postgres-repository";
import { PgCashboxSessionRepository } from "../cashbox-sessions/cashbox-sessions.postgres-repository";
import { PgAuditRepository } from "../audit/audit.postgres-repository";
import { AuditLogger } from "../audit/audit.logger";
import { requirePermission } from "../../src/middlewares/rbac.middleware";
import { Resources, Actions } from "../../src/config/rbac";

// ── Dependencias ────────────────────────────────────────

const requestRepo = new PgFundRequestRepository();
const movementRepo = new PgCashMovementRepository();
const sessionRepo = new PgCashboxSessionRepository();
const auditLogger = new AuditLogger(new PgAuditRepository());
const service = new FundRequestsService(requestRepo, movementRepo, sessionRepo, auditLogger);
const controller = new FundRequestsController(service);

// ── Rutas ───────────────────────────────────────────────

const router = Router();

router.post(
  "/",
  requirePermission(Resources.SOLICITUDES, Actions.CREAR),
  controller.create
);

router.get(
  "/",
  requirePermission(Resources.SOLICITUDES, Actions.VER),
  controller.list
);

router.get(
  "/:id",
  requirePermission(Resources.SOLICITUDES, Actions.VER),
  controller.getById
);

router.patch(
  "/:id/resolve",
  requirePermission(Resources.SOLICITUDES, Actions.APROBAR),
  controller.resolve
);

router.patch(
  "/:id/execute",
  requirePermission(Resources.SOLICITUDES, Actions.APROBAR),
  controller.execute
);

router.get(
  "/:id/approval",
  requirePermission(Resources.SOLICITUDES, Actions.VER),
  controller.getApproval
);

export default router;
