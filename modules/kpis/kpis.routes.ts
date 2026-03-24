// modules/kpis/kpis.routes.ts

import { Router } from "express";
import { KpisController } from "./kpis.controller";
import { KpisService } from "./kpis.service";
import { PgKpiRepository } from "./kpis.postgres-repository";
import { requirePermission } from "../../src/middlewares/rbac.middleware";
import { Resources, Actions } from "../../src/config/rbac";

// ── Dependencias ────────────────────────────────────────

const repository = new PgKpiRepository();
const service = new KpisService(repository);
const controller = new KpisController(service);

// ── Rutas ───────────────────────────────────────────────

const router = Router();

router.post(
  "/",
  requirePermission(Resources.KPI, Actions.CREAR),
  controller.create
);

router.get(
  "/dashboard",
  requirePermission(Resources.KPI, Actions.VER),
  controller.dashboard
);

router.get(
  "/trend",
  requirePermission(Resources.KPI, Actions.VER),
  controller.trend
);

router.get(
  "/average-balance",
  requirePermission(Resources.KPI, Actions.VER),
  controller.averageBalance
);

router.get(
  "/geographic-distribution",
  requirePermission(Resources.KPI, Actions.VER),
  controller.geographicDistribution
);

router.get(
  "/",
  requirePermission(Resources.KPI, Actions.VER),
  controller.list
);

router.get(
  "/:id",
  requirePermission(Resources.KPI, Actions.VER),
  controller.getById
);

export default router;
