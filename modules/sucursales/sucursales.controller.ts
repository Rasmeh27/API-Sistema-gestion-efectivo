// modules/sucursales/sucursales.controller.ts

import { NextFunction, Request, Response } from "express";
import {
  parseCreateSucursal,
  parseUpdateSucursal,
} from "./sucursales.dto";
import { SucursalError } from "./sucursales.errors";
import { SucursalesService } from "./sucursales.service";

export class SucursalesController {
  constructor(private readonly service: SucursalesService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = parseCreateSucursal(req.body);
      const sucursal = await this.service.create(dto);

      return res.status(201).json({ data: sucursal });
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
      const sucursal = await this.service.getById(this.getParamId(req));

      return res.status(200).json({ data: sucursal });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = parseUpdateSucursal(req.body);
      const sucursal = await this.service.update(this.getParamId(req), dto);

      return res.status(200).json({ data: sucursal });
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

  listAtms = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const atms = await this.service.listAtms(this.getParamId(req));

      return res.status(200).json({ data: atms });
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
    if (error instanceof SucursalError) {
      return res.status(error.status).json({
        error: { code: error.code, message: error.message },
      });
    }

    if (error instanceof Error) {
      const pgCode = (error as unknown as Record<string, unknown>).code;
      if (typeof pgCode === "string" && /^\d{5}$/.test(pgCode)) {
        if (pgCode === "23503") {
          return res.status(409).json({
            error: { code: "INTEGRITY_CONFLICT", message: "No se puede completar la operación porque existen registros relacionados" },
          });
        }
        if (pgCode === "23514") {
          return res.status(400).json({
            error: { code: "CHECK_VIOLATION", message: "Valor no permitido para uno de los campos enviados" },
          });
        }
        if (pgCode === "23505") {
          return res.status(409).json({
            error: { code: "UNIQUE_CONFLICT", message: "Ya existe un registro con ese código" },
          });
        }
        return res.status(500).json({
          error: { code: "DATABASE_ERROR", message: "Error interno de base de datos" },
        });
      }

      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: error.message },
      });
    }

    return next(error);
  }
}
