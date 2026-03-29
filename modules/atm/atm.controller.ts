// modules/atm/atm.controller.ts

import { NextFunction, Request, Response } from "express";
import { parseCreateAtm, parseDeposit, parseWithdraw } from "./atm.dto";
import { AtmError } from "./atm.errors";
import { AtmService } from "./atm.services";

export class AtmController {
  constructor(private readonly service: AtmService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = parseCreateAtm(req.body);
      const usuarioId = req.auth?.sub;
      const atm = await this.service.create(dto, usuarioId ?? "");
      return res.status(201).json({ data: atm });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const atm = await this.service.getById(this.getParamId(req));
      return res.status(200).json({ data: atm });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  deposit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = parseDeposit(req.body);
      const usuarioId = req.auth?.sub;

      const result = await this.service.deposit(this.getParamId(req), dto, usuarioId ?? "");

      return res.status(200).json({ data: result });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  withdraw = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = parseWithdraw(req.body);
      const usuarioId = req.auth?.sub;

      const result = await this.service.withdraw(this.getParamId(req), dto, usuarioId ?? "");

      return res.status(200).json({ data: result });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  getMovimientos = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const movimientos = await this.service.getMovimientos(this.getParamId(req));
      return res.status(200).json({ data: movimientos });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  private getParamId(req: Request): string {
    const id = req.params.id;
    if (Array.isArray(id)) return id[0];
    return id;
  }

  private handleError(error: unknown, res: Response, next: NextFunction) {
    if (error instanceof AtmError) {
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
