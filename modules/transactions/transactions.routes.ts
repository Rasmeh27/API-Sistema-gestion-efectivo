import { Router } from "express";
import { TransactionsController } from "./transactions.controller";
import { TransactionsService } from "./transactions.service";
import { PgTransactionRepository } from "./transactions.postgres-repository";

const router = Router();

// Instancias
const repo = new PgTransactionRepository();
const service = new TransactionsService(repo);
const controller = new TransactionsController(service);

// Rutas
router.post("/", controller.create);
router.get("/", controller.list);
router.get("/:id", controller.get);
router.put("/:id", controller.update);
router.delete("/:id", controller.delete);

export default router;