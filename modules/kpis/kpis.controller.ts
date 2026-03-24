// modules/kpis/kpis.controller.ts

import { NextFunction, Request, Response } from "express";
import {
  parseCreateKpiSnapshot,
  parseListKpiSnapshotsQuery,
  parseDashboardQuery,
  parseTrendQuery,
  parseAverageBalanceQuery,
} from "./kpis.dto";
import { KpiError } from "./kpis.errors";
import { KpisService } from "./kpis.service";

export class KpisController {
  constructor(private readonly service: KpisService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = parseCreateKpiSnapshot(req.body);
      const snapshot = await this.service.create(dto);

      return res.status(201).json({ data: snapshot });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const snapshot = await this.service.getById(this.getParamId(req));

      return res.status(200).json({ data: snapshot });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = parseListKpiSnapshotsQuery(req.query);
      const items = await this.service.list(filters);

      return res.status(200).json({ data: items });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  dashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = parseDashboardQuery(req.query);
      const data = await this.service.dashboard(filters);

      return res.status(200).json({ data });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  trend = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = parseTrendQuery(req.query);
      const data = await this.service.trend(query);

      return res.status(200).json({ data });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  averageBalance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = parseAverageBalanceQuery(req.query);
      const data = await this.service.averageBalance(query);

      return res.status(200).json({ data });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  geographicDistribution = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.geographicDistribution();

      return res.status(200).json({ data });
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
    if (error instanceof KpiError) {
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
