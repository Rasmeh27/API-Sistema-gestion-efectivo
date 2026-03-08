import { Router } from "express";
import authRoutes from "../../modules/auth/auth.routes";
import rolesRoutes from "../../modules/roles/role.routes";
import sucursalesRoutes from "../../modules/sucursales/sucursales.routes";
import usersRoutes from "../../modules/users/users.routes";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.use("/auth", authRoutes);
router.use("/roles", requireAuth, rolesRoutes);
router.use("/sucursales", requireAuth, sucursalesRoutes);
router.use("/users", requireAuth, usersRoutes);

export default router;