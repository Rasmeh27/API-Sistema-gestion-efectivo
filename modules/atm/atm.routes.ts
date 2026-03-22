// modules/atm/atm.routes.ts

import { Router } from "express";
import { AtmController } from "./atm.controller";
import { AtmService } from "./atm.services";
import { PgAtmRepository } from "./atm.postgres-repository";
import { PgCashMovementRepository } from "../cash-movements/cash-movements.postgres-repository";
import { CashMovementsService } from "../cash-movements/cash-movements.service";
import { PgCashboxSessionRepository } from "../cashbox-sessions/cashbox-sessions.postgres-repository";
import { SucursalesService } from "../sucursales/sucursales.service";
import { PgSucursalRepository } from "../sucursales/sucursales.postgres-repository";
import { requirePermission } from "../../src/middlewares/rbac.middleware";
import { Resources, Actions } from "../../src/config/rbac";

// ── Dependencias ────────────────────────────────────────

// Repositorio de ATM
const atmRepository = new PgAtmRepository();

// Repositorios y servicio de movimientos
const cashMovementRepository = new PgCashMovementRepository();
const cashboxSessionRepository = new PgCashboxSessionRepository();
const cashMovementsService = new CashMovementsService(
  cashMovementRepository,
  cashboxSessionRepository
);

// Repositorio y servicio de sucursales
const sucursalRepository = new PgSucursalRepository();
const sucursalesService = new SucursalesService(sucursalRepository);

// Servicio y controlador de ATM
const atmService = new AtmService(atmRepository, cashMovementsService, sucursalesService);
const atmController = new AtmController(atmService);

// ── Rutas ───────────────────────────────────────────────

const router = Router();

router.get(
  "/:id",
  requirePermission(Resources.MOVIMIENTOS, Actions.VER),
  atmController.getById
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