// src/app/routes.ts

import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";

import authRoutes from "../../modules/auth/auth.routes";
import rolesRoutes from "../../modules/roles/roles.routes";
import sucursalesRoutes from "../../modules/sucursales/sucursales.routes";
import usersRoutes from "../../modules/users/users.routes";
import cashboxesRoutes from "../../modules/cashboxes/cashboxes.routes";
import cashboxSessionRoutes from "../../modules/cashbox-sessions/cashbox-sessions.routes";
import cashboxAuditRoutes from "../../modules/cashbox-audits/cashbox-audits.routes";
import cashMovementRoutes from "../../modules/cash-movements/cash-movements.routes";
import fundRequestRoutes from "../../modules/fund-requests/fund-requests.routes";
import auditRoutes from "../../modules/audit/audit.routes";
import kpiRoutes from "../../modules/kpis/kpis.routes";
import atmRoutes from "../../modules/atm/atm.routes";
import recommendationsRoutes from "../../modules/recommendations/recommendations.routes";

const router = Router();

// Público
router.use("/auth", authRoutes);

// Protegidos (requieren autenticación)
router.use("/roles", requireAuth, rolesRoutes);
router.use("/sucursales", requireAuth, sucursalesRoutes);
router.use("/users", requireAuth, usersRoutes);
router.use("/cashboxes", requireAuth, cashboxesRoutes);
router.use("/cashbox-sessions", requireAuth, cashboxSessionRoutes);
router.use("/arqueos", requireAuth, cashboxAuditRoutes);
router.use("/movimientos", requireAuth, cashMovementRoutes);
router.use("/solicitudes", requireAuth, fundRequestRoutes);
router.use("/auditoria", requireAuth, auditRoutes);
router.use("/kpis", requireAuth, kpiRoutes);
router.use("/atm", requireAuth, atmRoutes);
router.use("/recomendaciones", requireAuth, recommendationsRoutes);

export default router;
