// modules/users/users.controller.ts

import { NextFunction, Request, Response } from "express";
import {
  parseCreateUser,
  parseListUsersQuery,
  parseUpdateUser,
  parseUpdateUserStatus,
} from "./users.dto";
import { UserError } from "./users.errors";
import { UsersService } from "./users.service";

export class UsersController {
  constructor(private readonly service: UsersService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = parseCreateUser(req.body);
      const user = await this.service.create(dto);

      return res.status(201).json({ data: user });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = parseListUsersQuery(
        req.query as Record<string, unknown>
      );
      const result = await this.service.list(query);

      return res.status(200).json({ data: result });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.service.getById(this.getParamId(req));

      return res.status(200).json({ data: user });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patch = parseUpdateUser(req.body);
      const user = await this.service.update(this.getParamId(req), patch);

      return res.status(200).json({ data: user });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  updateStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { status } = parseUpdateUserStatus(req.body);
      const user = await this.service.updateStatus(
        this.getParamId(req),
        status
      );

      return res.status(200).json({ data: user });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  deactivate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = await this.service.deactivate(this.getParamId(req));

      return res.status(200).json({ data: user });
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

  private handleError(
    error: unknown,
    res: Response,
    next: NextFunction
  ) {
    if (error instanceof UserError) {
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
