// src/shared/types/request.d.ts

/**
 * Contexto de autenticación inyectado por el middleware requireAuth.
 * Disponible en req.auth después de pasar el middleware.
 */
export interface AuthContext {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}
