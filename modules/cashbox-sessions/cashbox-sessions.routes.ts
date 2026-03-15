// modules/cashbox-sessions/cashbox-sessions.routes.ts

import { Router } from "express";
import { CashboxSessionsController } from "./cashbox-sessions.controller";
import { CashboxSessionsService } from "./cashbox-sessions.service";
import { PgCashboxSessionRepository } from "./cashbox-sessions.postgres-repository";
import { PgCashboxRepository } from "../cashboxes/cashboxes.postgres-repository";
import { requirePermission } from "../../src/middlewares/rbac.middleware";
import { Resources, Actions } from "../../src/config/rbac";

// ── Dependencias ────────────────────────────────────────

const sessionRepository = new PgCashboxSessionRepository();
const cashboxRepository = new PgCashboxRepository();
const service = new CashboxSessionsService(sessionRepository, cashboxRepository);
const controller = new CashboxSessionsController(service);

// ── Rutas ───────────────────────────────────────────────

const router = Router();

router.post(
  "/open",
  requirePermission(Resources.SESION_CAJA, Actions.CREAR),
  controller.open
);

router.patch(
  "/:id/close",
  requirePermission(Resources.SESION_CAJA, Actions.CERRAR),
  controller.close
);

router.get(
  "/",
  requirePermission(Resources.SESION_CAJA, Actions.VER),
  controller.list
);

router.get(
  "/:id",
  requirePermission(Resources.SESION_CAJA, Actions.VER),
  controller.getById
);

export default router;
