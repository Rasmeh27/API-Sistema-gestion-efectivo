import {Request, Response, NextFunction} from "express";
import { AuthService } from "./auth.service";
import { parseLoginRequest } from "./auth.dto";
import { AuthError } from "./auth.errors";

export class AuthController {
    constructor(private readonly auth: AuthService) {}

    login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = parseLoginRequest(req.body);
            const result = await this.auth.authenticate(dto);

            return res.status(200).json({data: result});
        } catch (err) {
            if (err instanceof AuthError) {
                return res.status(err.status).json({
                    error: {code: err.Code, message: err.message}
                });
            }

            if (err instanceof Error) {
                return res.status(400).json({
                    error: {code: "VALIDATION_ERROR", message: err.message}
                });
            }

            return next(err);
        }
    };
}