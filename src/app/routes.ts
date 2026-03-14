import { Router } from "express";
import authRoutes from "../../modules/auth/auth.routes";
import rolesRoutes from "../../modules/roles/role.routes";
import sucursalesRoutes from "../../modules/sucursales/sucursales.routes";
import usersRoutes from "../../modules/users/users.routes";
import { requireAuth } from "../middlewares/auth.middleware";
import sessionsRoutes from "../../modules/sessions/sessions.routes";
import transactionsRoutes from "../../modules/transactions/transactions.routes";
import treasuryRoutes from "../../modules/treasury/treasury.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/roles", requireAuth, rolesRoutes);
router.use("/sucursales", requireAuth, sucursalesRoutes);
router.use("/users", requireAuth, usersRoutes);
router.use("/sessions", requireAuth, sessionsRoutes);
router.use("/transactions", requireAuth, transactionsRoutes);
router.use("/treasury", requireAuth, treasuryRoutes);
export default router;