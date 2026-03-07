import { Request, Response, NextFunction } from "express";
import { UsersService } from "./users.service";
import { UserError } from "./users.errors";
import { parseCreateUser, parseUpdateUser } from "./users.dto";

/**
 * Encapsula la lógica de manejo HTTP para el modulo de usuarios.
 * Las rutas se enlazan en el archivo `users.routes.ts`.
 */
export class UsersController {
    constructor(private readonly svc: UsersService) {}

    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = parseCreateUser(req.body);
            const created = await this.svc.createUser(dto);
            res.status(201).json(created);
        } catch (err: any) {
            if (err instanceof UserError) {
                return res.status(err.status).json({ error: { code: err.Code, message: err.message } });
            }
            if (err instanceof Error) {
                return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: err.message } });
            }
            next(err);
        }
    };

    list = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const page = Number(req.query.page ?? 1);
            const perPage = Number(req.query.perPage ?? 20);
            const statusStr = req.query.status as string | undefined;
            const status = statusStr && ["ACTIVO", "INACTIVO"].includes(statusStr) ? (statusStr as "ACTIVO" | "INACTIVO") : undefined;
            const roleIds = req.query.roleIds ? (Array.isArray(req.query.roleIds) ? req.query.roleIds as string[] : [req.query.roleIds as string]) : undefined;
            const result = await this.svc.listUsers(page, perPage, status, roleIds);
            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    };

    get = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const u = await this.svc.getUser(req.params.id as string);
            res.status(200).json(u);
        } catch (err: any) {
            if (err instanceof UserError) {
                return res.status(err.status).json({ error: { code: err.Code, message: err.message } });
            }
            next(err);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const patch = parseUpdateUser(req.body);
            const updated = await this.svc.updateUser(req.params.id as string, patch);
            res.status(200).json(updated);
        } catch (err: any) {
            if (err instanceof UserError) {
                return res.status(err.status).json({ error: { code: err.Code, message: err.message } });
            }
            if (err instanceof Error) {
                return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: err.message } });
            }
            next(err);
        }
    };
updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { status } = req.body;
        const updated = await this.svc.updateUserStatus(req.params.id as string, status);
        res.status(200).json(updated);
    } catch (err: any) {
        if (err instanceof UserError) {
            return res.status(err.status).json({ error: { code: err.Code, message: err.message } });
        }
        if (err instanceof Error) {
            return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: err.message } });
        }
        next(err);
    }
};
    deactivate = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const u = await this.svc.deactivateUser(req.params.id as string);
            res.status(200).json(u);
        } catch (err: any) {
            if (err instanceof UserError) {
                return res.status(err.status).json({ error: { code: err.Code, message: err.message } });
            }
            next(err);
        }
    };
}

