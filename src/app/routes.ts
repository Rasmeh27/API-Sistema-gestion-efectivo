import express from "express";

import authRoutes from "../../modules/auth/auth.routes";

const router = express.Router();

// TODO: Import and use your module routes
// import auditRoutes from "../../modules/audit/audit.routes";
// import authRoutes from "../../modules/auth/auth.routes";
// import branchesRoutes from "../../modules/branches/branches.routes";

// router.use("/audit", auditRoutes);
// router.use("/auth", authRoutes);
// router.use("/branches", branchesRoutes);

router.use("/auth", authRoutes);

export default router;