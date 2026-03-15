// modules/cashbox-sessions/cashbox-sessions.controller.ts

import { NextFunction, Request, Response } from "express";
import {
  parseOpenSession,
  parseCloseSession,
  parseListSessionsQuery,
} from "./cashbox-sessions.dto";
import { CashboxSessionError } from "./cashbox-sessions.errors";
import { CashboxSessionsService } from "./cashbox-sessions.service";

export class CashboxSessionsController {
  constructor(private readonly service: CashboxSessionsService) {}

  open = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = parseOpenSession(req.body);
      const session = await this.service.open(dto, req.auth!.sub);

      return res.status(201).json({ data: session });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  close = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = parseCloseSession(req.body);
      const session = await this.service.close(
        this.getParamId(req),
        dto,
        req.auth!.sub
      );

      return res.status(200).json({ data: session });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await this.service.getById(this.getParamId(req));

      return res.status(200).json({ data: session });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = parseListSessionsQuery(
        req.query as Record<string, unknown>
      );
      const result = await this.service.list(query);

      return res.status(200).json({ data: result });
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
    if (error instanceof CashboxSessionError) {
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
