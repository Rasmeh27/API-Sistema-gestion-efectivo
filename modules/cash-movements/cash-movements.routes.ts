// modules/cash-movements/cash-movements.routes.ts

import { Router } from "express";
import { CashMovementsController } from "./cash-movements.controller";
import { CashMovementsService } from "./cash-movements.service";
import { PgCashMovementRepository } from "./cash-movements.postgres-repository";
import { PgCashboxSessionRepository } from "../cashbox-sessions/cashbox-sessions.postgres-repository";
import { requirePermission } from "../../src/middlewares/rbac.middleware";
import { Resources, Actions } from "../../src/config/rbac";

// ── Dependencias ────────────────────────────────────────

const movementRepo = new PgCashMovementRepository();
const sessionRepo = new PgCashboxSessionRepository();
const service = new CashMovementsService(movementRepo, sessionRepo);
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

export default router;
