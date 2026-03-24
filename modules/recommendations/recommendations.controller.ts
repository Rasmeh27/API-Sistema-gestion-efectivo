// modules/recommendations/recommendations.controller.ts

import { NextFunction, Request, Response } from "express";
import {
  parseUpdateRecommendation,
  parseListRecommendationsQuery,
  parseChatMessage,
} from "./recommendations.dto";
import { RecommendationError } from "./recommendations.errors";
import { RecommendationsService } from "./recommendations.service";

export class RecommendationsController {
  constructor(private readonly service: RecommendationsService) {}

  generate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sucursalId = typeof req.query.sucursalId === "string"
        ? req.query.sucursalId.trim() || undefined
        : undefined;

      const recommendations = await this.service.generate(sucursalId);

      return res.status(201).json({ data: recommendations });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = parseListRecommendationsQuery(req.query);
      const items = await this.service.list(filters);

      return res.status(200).json({ data: items });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = this.getParamId(req);
      const record = await this.service.getById(id);

      return res.status(200).json({ data: record });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = this.getParamId(req);
      const dto = parseUpdateRecommendation(req.body);
      const record = await this.service.update(id, dto);

      return res.status(200).json({ data: record });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  chat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = parseChatMessage(req.body);
      const response = await this.service.chat(dto);

      return res.status(200).json({ data: response });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  // ── Helpers privados ──────────────────────────────────

  private getParamId(req: Request): string {
    const id = req.params.id;
    if (Array.isArray(id)) return id[0];
    return id;
  }

  private handleError(error: unknown, res: Response, next: NextFunction) {
    if (error instanceof RecommendationError) {
      return res.status(error.status).json({
        error: { code: error.code, message: error.message },
      });
    }

    if (error instanceof Error) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: error.message },
      });
    }

    return next(error);
  }
}
