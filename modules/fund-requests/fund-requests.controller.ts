// modules/fund-requests/fund-requests.controller.ts

import { NextFunction, Request, Response } from "express";
import {
  parseCreateFundRequest,
  parseResolveRequest,
  parseListFundRequestsQuery,
} from "./fund-requests.dto";
import { FundRequestError } from "./fund-requests.errors";
import { FundRequestsService } from "./fund-requests.service";

export class FundRequestsController {
  constructor(private readonly service: FundRequestsService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = parseCreateFundRequest(req.body);
      const request = await this.service.create(dto, req.auth!.sub);

      return res.status(201).json({ data: request });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  resolve = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = parseResolveRequest(req.body);
      const result = await this.service.resolve(
        this.getParamId(req),
        dto,
        req.auth!.sub
      );

      return res.status(200).json({ data: result });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const request = await this.service.getById(this.getParamId(req));

      return res.status(200).json({ data: request });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = parseListFundRequestsQuery(req.query);
      const items = await this.service.list(filters);

      return res.status(200).json({ data: items });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  getApproval = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const approval = await this.service.getApproval(this.getParamId(req));

      return res.status(200).json({ data: approval });
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
    if (error instanceof FundRequestError) {
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
