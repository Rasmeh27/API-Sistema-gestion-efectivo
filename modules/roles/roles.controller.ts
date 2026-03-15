// modules/roles/roles.controller.ts

import { NextFunction, Request, Response } from "express";
import { parseCreateRole, parseUpdateRole } from "./roles.dto";
import { RoleError } from "./roles.errors";
import { RolesService } from "./roles.service";

export class RolesController {
  constructor(private readonly service: RolesService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = parseCreateRole(req.body);
      const role = await this.service.create(dto);

      return res.status(201).json({ data: role });
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
      const role = await this.service.getById(this.getParamId(req));

      return res.status(200).json({ data: role });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = parseUpdateRole(req.body);
      const role = await this.service.update(this.getParamId(req), dto);

      return res.status(200).json({ data: role });
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
    if (error instanceof RoleError) {
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
