// modules/auth/auth.controller.ts

import { Request, Response, NextFunction } from "express";
import { AuthService, RequestMeta } from "./auth.service";
import { AuthError } from "./auth.errors";
import {
  parseLoginRequest,
  parseRefreshRequest,
  parseLogoutRequest,
} from "./auth.dto";

export class AuthController {
  constructor(private readonly auth: AuthService) {}

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = parseLoginRequest(req.body);
      const meta = this.extractRequestMeta(req);
      const result = await this.auth.login(dto, meta);

      return res.status(200).json({ data: result });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = parseRefreshRequest(req.body);
      const meta = this.extractRequestMeta(req);
      const result = await this.auth.refresh(dto, meta);

      return res.status(200).json({ data: result });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = parseLogoutRequest(req.body);
      const meta = this.extractRequestMeta(req);
      await this.auth.logout(dto.refreshToken, meta);

      return res.status(204).send();
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  logoutAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuarioId = req.auth!.sub;
      const revoked = await this.auth.logoutAll(usuarioId);

      return res.status(200).json({
        data: { revokedSessions: revoked },
      });
    } catch (error) {
      return this.handleError(error, res, next);
    }
  };

  // ── Helpers privados ────────────────────────────────

  private extractRequestMeta(req: Request): RequestMeta {
    return {
      ip: req.ip ?? req.socket.remoteAddress ?? null,
      userAgent: req.get("user-agent") ?? null,
    };
  }

  private handleError(
    error: unknown,
    res: Response,
    next: NextFunction
  ) {
    if (error instanceof AuthError) {
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
