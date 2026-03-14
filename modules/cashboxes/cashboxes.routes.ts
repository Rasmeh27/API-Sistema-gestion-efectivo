import { Router } from "express";
import { CashboxesController } from "./cashboxes.controller";
import { CashboxesRepository } from "./cashboxes.postgres-repository";
import { CashboxesService } from "./cashboxes.service";
import { Pool } from "pg";

const router = Router();

// Instancias del módulo (sin pool externo)
const repo = new CashboxesRepository()
const service = new CashboxesService(repo);
const controller = new CashboxesController(service);

// Endpoints
router.post("/", controller.create);
router.get("/", controller.findAll);
router.put("/:id", controller.update);

export default router;