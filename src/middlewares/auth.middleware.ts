// src/middlewares/auth.middleware.ts

import jwt, { JwtPayload } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

// AuthContext se importa globalmente desde src/shared/types/request.d.ts
// No se redefine aquí (DRY)

interface AccessTokenPayload extends JwtPayload {
  sub: string;
  email: string;
  roles?: string[];
  permissions?: string[];
}

function extractBearerToken(authorization?: string): string | null {
  if (!authorization) return null;

  const parts = authorization.trim().split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") return null;

  return parts[1];
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = extractBearerToken(req.header("authorization"));

  if (!token) {
    return res.status(401).json({
      error: {
        code: "UNAUTHENTICATED",
        message: "Token no proporcionado",
      },
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      env.jwtSecret
    ) as AccessTokenPayload;

    if (!decoded.sub || !decoded.email) {
      return res.status(401).json({
        error: {
          code: "INVALID_TOKEN",
          message: "Token inválido: payload incompleto",
        },
      });
    }

    req.auth = {
      sub: decoded.sub,
      email: decoded.email,
      roles: Array.isArray(decoded.roles) ? decoded.roles : [],
      permissions: Array.isArray(decoded.permissions)
        ? decoded.permissions
        : [],
    };

    return next();
  } catch (error) {
    const isTokenExpired =
      error instanceof Error && error.name === "TokenExpiredError";

    return res.status(401).json({
      error: {
        code: isTokenExpired ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
        message: isTokenExpired
          ? "Token expirado"
          : "Token inválido",
      },
    });
  }
}
