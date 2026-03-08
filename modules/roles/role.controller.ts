import { NextFunction, Request, Response } from "express";
import { parseCreateRole, parseUpdateRole } from "./roles.dto"; 
import { RoleError } from "./roles.errors";
import { RolesService } from "./roles.service";

export class RolesController {
  constructor(private readonly service: RolesService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = parseCreateRole(req.body);
      const created = await this.service.createRole(dto);

      return res.status(201).json(created);
    } catch (error) {
      if (error instanceof RoleError) {
        return res.status(error.status).json({
          error: {
            code: error.code,
            message: error.message,
          },
        });
      }

      if (error instanceof Error) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: error.message,
          },
        });
      }

      return next(error);
    }
  };

  list = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const items = await this.service.listRoles();

        return res.status(200).json(items);
    } catch (error) {
        return next(error);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const item = await this.service.getRole(req.params.id as string);

        return res.status(200).json(item);
  } catch (error) {
    if (error instanceof RoleError) {
      return res.status(error.status).json({
        error: {
            code: error.code,
            message: error.message,
        },
      });
    }

    return next(error); 
    }
};

update = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = parseUpdateRole(req.body);
        const updated = await this.service.updateRole(req.params.id as string, dto);

        return res.status(200).json(updated);

    }catch (error) {
        if (error instanceof RoleError) {
            return res.status(error.status).json({
                error: {
                    code: error.code,
                    message: error.message,
                },
            });
        }

        if (error instanceof Error) {
            return res.status(400).json({
                error: { 
                    code: "VALIDATION_ERROR",
                    message: error.message,
                },
            });
        }

        return next(error);
    }
}; 

delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await this.service.deleteRole(req.params.id as string);

        return res.status(204).send();
    } catch (error) {
        if (error instanceof RoleError) {
            return res.status(error.status).json({
                error: {
                    code: error.code,
                    message: error.message,
                },
            });
        }
        return next(error);
        }  
    };
}
