// modules/fund-requests/fund-requests.routes.ts

import { Router } from "express";
import { FundRequestsController } from "./fund-requests.controller";
import { FundRequestsService } from "./fund-requests.service";
import { PgFundRequestRepository } from "./fund-requests.postgres-repository";
import { requirePermission } from "../../src/middlewares/rbac.middleware";
import { Resources, Actions } from "../../src/config/rbac";

// ── Dependencias ────────────────────────────────────────

const requestRepo = new PgFundRequestRepository();
const service = new FundRequestsService(requestRepo);
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

router.get(
  "/:id/approval",
  requirePermission(Resources.SOLICITUDES, Actions.VER),
  controller.getApproval
);

export default router;
