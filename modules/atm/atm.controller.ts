import { NextFunction, Request, Response } from "express";
import { parseDeposit, parseWithdraw } from "./atm.dto";
import { AtmError } from "./atm.errors";
import { AtmService } from "./atm.services";

export class AtmController {
  constructor(private readonly service: AtmService) {}

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

      // Usuario y sesión de caja desde el contexto
      const usuarioId = req.auth?.sub;
      const sesionCajaId = req.body.sesionCajaId;

      const atm = await this.service.deposit(
        this.getParamId(req),
        dto,
        usuarioId!,
        sesionCajaId
      );

      return res.status(200).json({ data: atm });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  withdraw = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = parseWithdraw(req.body);

      const usuarioId = req.auth?.sub;
      const sesionCajaId = req.body.sesionCajaId;

      const atm = await this.service.withdraw(
        this.getParamId(req),
        dto,
        usuarioId!,
        sesionCajaId
      );

      return res.status(200).json({ data: atm });
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
    if (error instanceof AtmError) {
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