// modules/cash-movements/cash-movements.controller.ts

import { NextFunction, Request, Response } from "express";
import {
  parseCreateMovement,
  parseListMovementsQuery,
} from "./cash-movements.dto";
import { CashMovementError } from "./cash-movements.errors";
import { CashMovementsService } from "./cash-movements.service";

export class CashMovementsController {
  constructor(private readonly service: CashMovementsService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = parseCreateMovement(req.body);
      const movement = await this.service.create(dto, req.auth!.sub);

      return res.status(201).json({ data: movement });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const movement = await this.service.getById(this.getParamId(req));

      return res.status(200).json({ data: movement });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = parseListMovementsQuery(req.query);
      const items = await this.service.list(filters);

      return res.status(200).json({ data: items });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  void = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const movement = await this.service.void(
        this.getParamId(req),
        req.auth!.sub
      );

      return res.status(200).json({ data: movement });
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
    if (error instanceof CashMovementError) {
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
