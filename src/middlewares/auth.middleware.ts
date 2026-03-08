import Jwt, { JwtPayload } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

type AuthContext = {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

type AccessTokenPayload = JwtPayload & {
  sub: string;
  email: string;
  roles?: string[];
  permissions?: string[];
};

function extractBearerToken(authorization?: string): string | null {
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.trim().split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
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
    const decoded = Jwt.verify(token, env.jwtSecret) as AccessTokenPayload;

    if (!decoded.sub || !decoded.email) {
      return res.status(401).json({
        error: {
          code: "INVALID_TOKEN",
          message: "Token inválido",
        },
      });
    }

    req.auth = {
      sub: decoded.sub,
      email: decoded.email,
      roles: Array.isArray(decoded.roles) ? decoded.roles : [],
      permissions: Array.isArray(decoded.permissions) ? decoded.permissions : [],
    };

    return next();
  } catch (_error) {
    return res.status(401).json({
      error: {
        code: "INVALID_TOKEN",
        message: "Token inválido o expirado",
      },
    });
  }
}