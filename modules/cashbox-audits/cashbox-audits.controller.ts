// modules/cashbox-audits/cashbox-audits.controller.ts

import { NextFunction, Request, Response } from "express";
import {
  parseCreateAudit,
  parseListAuditsQuery,
} from "./cashbox-audits.dto";
import { CashboxAuditError } from "./cashbox-audits.errors";
import { CashboxAuditsService } from "./cashbox-audits.service";

export class CashboxAuditsController {
  constructor(private readonly service: CashboxAuditsService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = parseCreateAudit(req.body);
      const audit = await this.service.create(dto, req.auth!.sub);

      return res.status(201).json({ data: audit });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const audit = await this.service.getById(this.getParamId(req));

      return res.status(200).json({ data: audit });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = parseListAuditsQuery(req.query);
      const items = await this.service.list(filters);

      return res.status(200).json({ data: items });
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
    if (error instanceof CashboxAuditError) {
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
