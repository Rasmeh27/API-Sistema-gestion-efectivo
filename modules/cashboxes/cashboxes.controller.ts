import { Request, Response, NextFunction } from "express";
import { CashboxesService } from "./cashboxes.service";
import { parseCreateCashbox, parseUpdateCashbox } from "./cashboxes.dto";
import { CashboxError } from "./cashboxes.errors";

export class CashboxesController {
  constructor(private readonly service: CashboxesService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = parseCreateCashbox(req.body);
      const result = await this.service.create(dto);

      return res.status(201).json({ data: result });
    } catch (err) {
      if (err instanceof CashboxError) {
        return res.status(err.status).json({
          error: { code: err.Code, message: err.message },
        });
      }
      if (err instanceof Error) {
        return res.status(400).json({
          error: { code: "VALIDATION_ERROR", message: err.message },
        });
      }
      return next(err);
    }
  };

  findAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.findAll();
      return res.status(200).json({ data: result });
    } catch (err) {
      return next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string; // 👈 fix: forzar a string

      if (!id) {
        return res.status(400).json({
          error: { code: "INVALID_ID", message: "id es requerido" },
        });
      }

      const dto = parseUpdateCashbox(req.body);
      const result = await this.service.update(id, dto);

      if (!result) {
        return res.status(404).json({
          error: { code: "NOT_FOUND", message: "Cashbox no encontrada" },
        });
      }

      return res.status(200).json({ data: result });
    } catch (err) {
      if (err instanceof CashboxError) {
        return res.status(err.status).json({
          error: { code: err.Code, message: err.message },
        });
      }
      if (err instanceof Error) {
        return res.status(400).json({
          error: { code: "VALIDATION_ERROR", message: err.message },
        });
      }
      return next(err);
    }
  };
}