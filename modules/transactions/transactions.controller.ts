import { NextFunction, Request, Response } from "express";
import { parseCreateTransaction, parseUpdateTransaction } from "./transactions.dto";
import { TransactionError } from "./transactions.errors";
import { TransactionsService } from "./transactions.service";

export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = parseCreateTransaction(req.body);
      const created = await this.service.createTransaction(dto);
      return res.status(201).json(created);
    } catch (error) {
      if (error instanceof TransactionError) {
        return res.status(error.status).json({ error: { code: error.code, message: error.message } });
      }
      if (error instanceof Error) {
        return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: error.message } });
      }
      return next(error);
    }
  };

  list = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await this.service.listTransactions();
      return res.status(200).json(items);
    } catch (error) {
      return next(error);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const item = await this.service.getTransaction(id);
      return res.status(200).json(item);
    } catch (error) {
      if (error instanceof TransactionError) {
        return res.status(error.status).json({ error: { code: error.code, message: error.message } });
      }
      return next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = parseUpdateTransaction(req.body);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updated = await this.service.updateTransaction(id, dto);
      return res.status(200).json(updated);
    } catch (error) {
      if (error instanceof TransactionError) {
        return res.status(error.status).json({ error: { code: error.code, message: error.message } });
      }
      if (error instanceof Error) {
        return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: error.message } });
      }
      return next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await this.service.deleteTransaction(id);
      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof TransactionError) {
        return res.status(error.status).json({ error: { code: error.code, message: error.message } });
      }
      return next(error);
    }
  };
}