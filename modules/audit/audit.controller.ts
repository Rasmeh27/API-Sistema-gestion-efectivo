// modules/audit/audit.controller.ts

import { NextFunction, Request, Response } from "express";
import {
  parseCreateAuditEvent,
  parseListAuditEventsQuery,
} from "./audit.dto";
import { AuditError } from "./audit.errors";
import { AuditService } from "./audit.service";

export class AuditController {
  constructor(private readonly service: AuditService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = parseCreateAuditEvent(req.body);

      if (!dto.usuarioId) {
        dto.usuarioId = req.auth!.sub;
      }

      const event = await this.service.create(dto);

      return res.status(201).json({ data: event });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const event = await this.service.getById(this.getParamId(req));

      return res.status(200).json({ data: event });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = parseListAuditEventsQuery(req.query);
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
    if (error instanceof AuditError) {
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
