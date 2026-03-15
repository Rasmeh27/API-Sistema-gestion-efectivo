// src/middlewares/rbac.middleware.ts

import { NextFunction, Request, Response } from "express";

// AuthContext se importa globalmente desde src/shared/types/request.d.ts
// No se redefine aquí (DRY)

function normalizePermission(resource: string, action: string): string {
  return `${resource.trim()}:${action.trim()}`.toUpperCase();
}

export function requirePermission(resource: string, action: string) {
  const requiredPermission = normalizePermission(resource, action);

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({
        error: {
          code: "UNAUTHENTICATED",
          message: "No autenticado",
        },
      });
    }

    const userPermissions = new Set(
      req.auth.permissions.map((p) => p.toUpperCase())
    );

    if (!userPermissions.has(requiredPermission)) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: `Permiso requerido: ${requiredPermission}`,
        },
      });
    }

    return next();
  };
}

/**
 * Middleware que requiere al menos uno de los roles especificados.
 */
export function requireRole(...roles: string[]) {
  const requiredRoles = new Set(
    roles.map((r) => r.trim().toUpperCase())
  );

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({
        error: {
          code: "UNAUTHENTICATED",
          message: "No autenticado",
        },
      });
    }

    const userRoles = req.auth.roles.map((r) => r.toUpperCase());
    const hasRole = userRoles.some((role) => requiredRoles.has(role));

    if (!hasRole) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: `Rol requerido: ${roles.join(" | ")}`,
        },
      });
    }

    return next();
  };
}
