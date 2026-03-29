// modules/atm/atm.routes.ts

import { Router } from "express";
import { AtmController } from "./atm.controller";
import { AtmService } from "./atm.services";
import { PgAtmRepository } from "./atm.postgres-repository";
import { AuditLogger } from "../audit/audit.logger";
import { PgAuditRepository } from "../audit/audit.postgres-repository";
import { requirePermission } from "../../src/middlewares/rbac.middleware";
import { Resources, Actions } from "../../src/config/rbac";

const atmRepository = new PgAtmRepository();
const auditLogger = new AuditLogger(new PgAuditRepository());
const atmService = new AtmService(atmRepository, auditLogger);
const atmController = new AtmController(atmService);

const router = Router();

router.post(
  "/",
  requirePermission(Resources.SUCURSALES, Actions.EDITAR),
  atmController.create
);

router.get(
  "/:id",
  requirePermission(Resources.MOVIMIENTOS, Actions.VER),
  atmController.getById
);

router.get(
  "/:id/movimientos",
  requirePermission(Resources.MOVIMIENTOS, Actions.VER),
  atmController.getMovimientos
);

router.post(
  "/:id/deposit",
  requirePermission(Resources.MOVIMIENTOS, Actions.CREAR),
  atmController.deposit
);

router.post(
  "/:id/withdraw",
  requirePermission(Resources.MOVIMIENTOS, Actions.CREAR),
  atmController.withdraw
);

export default router;
