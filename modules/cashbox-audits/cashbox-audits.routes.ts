// modules/cashbox-audits/cashbox-audits.routes.ts

import { Router } from "express";
import { CashboxAuditsController } from "./cashbox-audits.controller";
import { CashboxAuditsService } from "./cashbox-audits.service";
import { PgCashboxAuditRepository } from "./cashbox-audits.postgres-repository";
import { PgCashboxSessionRepository } from "../cashbox-sessions/cashbox-sessions.postgres-repository";
import { requirePermission } from "../../src/middlewares/rbac.middleware";
import { Resources, Actions } from "../../src/config/rbac";

// ── Dependencias ────────────────────────────────────────

const auditRepo = new PgCashboxAuditRepository();
const sessionRepo = new PgCashboxSessionRepository();
const service = new CashboxAuditsService(auditRepo, sessionRepo);
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
