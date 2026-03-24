// modules/recommendations/recommendations.routes.ts

import { Router } from "express";
import { RecommendationsController } from "./recommendations.controller";
import { RecommendationsService } from "./recommendations.service";
import { PgRecommendationRepository } from "./recommendations.postgres-repository";
import { LlmService } from "./recommendations.llm-service";
import { ContextBuilder } from "./recommendations.context-builder";
import { PgKpiRepository } from "../kpis/kpis.postgres-repository";
import { requirePermission } from "../../src/middlewares/rbac.middleware";
import { Resources, Actions } from "../../src/config/rbac";

// ── Dependencias ────────────────────────────────────────

const repository = new PgRecommendationRepository();
const llm = new LlmService();
const kpiRepo = new PgKpiRepository();
const contextBuilder = new ContextBuilder(kpiRepo);
const service = new RecommendationsService(repository, llm, contextBuilder);
const controller = new RecommendationsController(service);

// ── Rutas ───────────────────────────────────────────────

const router = Router();

// Rutas con nombre fijo ANTES de /:id para evitar colisiones
router.post(
  "/generate",
  requirePermission(Resources.RECOMENDACIONES, Actions.CREAR),
  controller.generate
);

router.post(
  "/chat",
  requirePermission(Resources.RECOMENDACIONES, Actions.VER),
  controller.chat
);

router.get(
  "/",
  requirePermission(Resources.RECOMENDACIONES, Actions.VER),
  controller.list
);

router.get(
  "/:id",
  requirePermission(Resources.RECOMENDACIONES, Actions.VER),
  controller.getById
);

router.patch(
  "/:id",
  requirePermission(Resources.RECOMENDACIONES, Actions.EDITAR),
  controller.update
);

export default router;
