import { NextFunction, Request, Response } from "express";

export type AuthContext = {
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

function normalizePermission(resource: string, action: string): string {
  return `${resource}:${action}`.trim().toUpperCase();
}

export function requirePermission(resource: string, action: string) {
  const expected = normalizePermission(resource, action);

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({
        error: {
          code: "UNAUTHENTICATED",
          message: "No autenticado",
        },
      });
    }

    const granted = new Set((req.auth.permissions ?? []).map((value) => value.toUpperCase()));

    if (!granted.has(expected)) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: `Permiso requerido: ${expected}`,
        },
      });
    }

    return next();
  };
}