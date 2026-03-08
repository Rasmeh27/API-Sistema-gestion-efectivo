import { NextFunction, Request, Response } from "express";
import { parseCreateUser, parseUpdateUser, parseUpdateUserStatus } from "./users.dto";
import { UserError } from "./users.errors";
import { UsersService } from "./users.service";

export class UsersController {
  constructor(private readonly svc: UsersService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = parseCreateUser(req.body);
      const created = await this.svc.createUser(dto);

      res.status(201).json(created);
    } catch (err: unknown) {
      if (err instanceof UserError) {
        return res.status(err.status).json({
          error: {
            code: err.Code,
            message: err.message,
          },
        });
      }

      if (err instanceof Error) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: err.message,
          },
        });
      }

      return next(err);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Number(req.query.page ?? 1);
      const perPage = Number(req.query.perPage ?? 20);
      const statusStr = req.query.status as string | undefined;
      const status =
        statusStr && ["ACTIVO", "INACTIVO"].includes(statusStr)
          ? (statusStr as "ACTIVO" | "INACTIVO")
          : undefined;
      const roleIds = req.query.roleIds
        ? Array.isArray(req.query.roleIds)
          ? (req.query.roleIds as string[])
          : [req.query.roleIds as string]
        : undefined;

      const result = await this.svc.listUsers(page, perPage, status, roleIds);

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.svc.getUser(req.params.id as string);

      res.status(200).json(user);
    } catch (err: unknown) {
      if (err instanceof UserError) {
        return res.status(err.status).json({
          error: {
            code: err.Code,
            message: err.message,
          },
        });
      }

      return next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patch = parseUpdateUser(req.body);
      const updated = await this.svc.updateUser(req.params.id as string, patch);

      res.status(200).json(updated);
    } catch (err: unknown) {
      if (err instanceof UserError) {
        return res.status(err.status).json({
          error: {
            code: err.Code,
            message: err.message,
          },
        });
      }

      if (err instanceof Error) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: err.message,
          },
        });
      }

      return next(err);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = parseUpdateUserStatus(req.body);
      const updated = await this.svc.updateUserStatus(req.params.id as string, status);

      res.status(200).json(updated);
    } catch (err: unknown) {
      if (err instanceof UserError) {
        return res.status(err.status).json({
          error: {
            code: err.Code,
            message: err.message,
          },
        });
      }

      if (err instanceof Error) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: err.message,
          },
        });
      }

      return next(err);
    }
  };

  deactivate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.svc.deactivateUser(req.params.id as string);

      res.status(200).json(user);
    } catch (err: unknown) {
      if (err instanceof UserError) {
        return res.status(err.status).json({
          error: {
            code: err.Code,
            message: err.message,
          },
        });
      }

      return next(err);
    }
  };
}