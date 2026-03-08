import { Router } from "express";
import { SucursalesController } from "./sucursales.controller";
import { PgSucursalRepository } from "./roles.postgres-repository";
import { SucursalesService } from "./sucursales.service";
import { requirePermission } from "../../src/middlewares/rbac.middleware";

const router = Router();

const repository = new PgSucursalRepository();
const service = new SucursalesService(repository);
const controller = new SucursalesController(service);

router.get("/", requirePermission("SUCURSALES", "VER"), controller.list);
router.get("/:id", requirePermission("SUCURSALES", "VER"), controller.get);
router.post("/", requirePermission("SUCURSALES", "CREAR"), controller.create);
router.patch("/:id", requirePermission("SUCURSALES", "EDITAR"), controller.update);
router.delete("/:id", requirePermission("SUCURSALES", "ELIMINAR"), controller.delete);

export default router;