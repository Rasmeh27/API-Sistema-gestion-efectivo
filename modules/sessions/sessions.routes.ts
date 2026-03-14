import { Router } from "express";
import { SessionsController } from "./sessions.controller";
import { SessionsService } from "./sessions.service";
import { PgSessionRepository } from "./sessions.postgres-repository.ts";

const router = Router();

const repo = new PgSessionRepository();
const svc = new SessionsService(repo);
const controller = new SessionsController(svc);

router.post("/", controller.create);
router.get("/", controller.list);
router.get("/:id", controller.get);
router.delete("/:id", controller.delete);

export default router;