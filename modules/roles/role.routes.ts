import { Router } from "express";
import { RolesController } from "./role.controller";
import { PgRoleRepository } from "./roles.postgres-repository";
import { RolesService } from "./roles.service";
import { requirePermission } from "../../src/middlewares/rbac.middleware";


const router = Router();

const repository = new PgRoleRepository();
const service = new RolesService(repository);
const controller = new RolesController(service);

router.get("/", requirePermission("ROLES", "VER"), controller.list);
router.get("/:id", requirePermission("ROLES", "VER"), controller.get);
router.post("/", requirePermission("ROLES", "CREAR"), controller.create);
router.patch("/:id", requirePermission("ROLES", "EDITAR"), controller.update);
router.delete("/:id", requirePermission("ROLES", "ELIMINAR"), controller.delete);

export default router;