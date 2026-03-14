import { Router } from "express";
import { TreasuryController } from "./treasury.controller";
import { TreasuryService } from "./treasury.service";
import { PgTreasuryRepository } from "./treasury.postgres-repository";

const router = Router();

// Instancias
const repo = new PgTreasuryRepository();
const service = new TreasuryService(repo);
const controller = new TreasuryController(service);

// Rutas
router.post("/", controller.create);
router.get("/", controller.list);
router.get("/:id", controller.get);
router.put("/:id", controller.update);
router.delete("/:id", controller.delete);

export default router;