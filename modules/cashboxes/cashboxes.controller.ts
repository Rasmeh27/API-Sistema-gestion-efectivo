// modules/cashboxes/cashboxes.controller.ts

import { NextFunction, Request, Response } from "express";
import { parseCreateCashbox, parseUpdateCashbox } from "./cashboxes.dto";
import { CashboxError } from "./cashboxes.errors";
import { CashboxesService } from "./cashboxes.service";

export class CashboxesController {
  constructor(private readonly service: CashboxesService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = parseCreateCashbox(req.body);
      const cashbox = await this.service.create(dto);

      return res.status(201).json({ data: cashbox });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  list = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await this.service.list();

      return res.status(200).json({ data: items });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cashbox = await this.service.getById(this.getParamId(req));

      return res.status(200).json({ data: cashbox });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = parseUpdateCashbox(req.body);
      const cashbox = await this.service.update(this.getParamId(req), dto);

      return res.status(200).json({ data: cashbox });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(this.getParamId(req));

      return res.status(204).send();
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
    if (error instanceof CashboxError) {
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
