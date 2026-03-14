import { Request, Response } from "express";
import { SessionsService } from "./sessions.service";
import { SessionNotFoundError } from "./sessions.errors";

export class SessionsController {
  constructor(private svc: SessionsService) {}

  create = async (req: Request, res: Response) => {
    const session = await this.svc.create(req.body);
    res.status(201).json(session);
  };

  list = async (_req: Request, res: Response) => {
    const sessions = await this.svc.list();
    res.json({ items: sessions, total: sessions.length });
  };

  get = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string; 

    const session = await this.svc.get(id);
    res.json(session);
  } catch (err) {
    if (err instanceof SessionNotFoundError) {
      return res.status(404).json({ message: err.message });
    }
    throw err;
  }
};


 delete = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string; 

    await this.svc.delete(id);
    res.status(204).send();
  } catch (err) {
    if (err instanceof SessionNotFoundError) {
      return res.status(404).json({ message: err.message });
    }
    throw err;
  }
};

}