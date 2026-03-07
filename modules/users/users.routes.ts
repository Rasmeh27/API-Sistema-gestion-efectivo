import { Router } from "express";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { UserMemoryRepository } from "./users.memory-repository";

const router = Router();

// Composición raíz para el módulo de usuarios
const repo = new UserMemoryRepository();
const svc = new UsersService(repo);
const controller = new UsersController(svc);

router.post("/", controller.create);
router.get("/", controller.list);
router.get("/:id", controller.get);
router.patch("/:id", controller.update);
router.patch("/:id/status", controller.updateStatus); // <-- aquí agregamos el endpoint
router.patch("/:id/deactivate", controller.deactivate);

export default router;