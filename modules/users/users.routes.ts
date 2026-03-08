import { Router } from "express";
import { UsersController } from "./users.controller";
import { PgUserRepository } from "./user.postgres-repository";
import { UsersService } from "./users.service";

const router = Router();

const repo = new PgUserRepository();
const svc = new UsersService(repo);
const controller = new UsersController(svc);

router.post("/", controller.create);
router.get("/", controller.list);
router.get("/:id", controller.get);
router.patch("/:id", controller.update);
router.patch("/:id/status", controller.updateStatus);
router.patch("/:id/deactivate", controller.deactivate);

export default router;