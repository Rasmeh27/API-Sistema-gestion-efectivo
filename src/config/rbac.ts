// src/config/rbac.ts

/**
 * Recursos del sistema protegidos por RBAC.
 * Cada recurso tiene acciones permitidas.
 */
export const Resources = {
  USUARIOS: "USUARIOS",
  ROLES: "ROLES",
  PERMISOS: "PERMISOS",
  SUCURSALES: "SUCURSALES",
  CAJAS: "CAJAS",
  SESION_CAJA: "SESION_CAJA",
  MOVIMIENTOS: "MOVIMIENTOS",
  TESORERIA: "TESORERIA",
  SOLICITUDES: "SOLICITUDES",
  AUDITORIA: "AUDITORIA",
  PARAMETROS: "PARAMETROS",
  KPI: "KPI",
  RECOMENDACIONES: "RECOMENDACIONES",
  ARQUEOS: "ARQUEOS",
} as const;

export const Actions = {
  VER: "VER",
  CREAR: "CREAR",
  EDITAR: "EDITAR",
  ELIMINAR: "ELIMINAR",
  APROBAR: "APROBAR",
  CERRAR: "CERRAR",
  EXPORTAR: "EXPORTAR",
  ADMIN: "ADMIN",
} as const;


export type Resource = (typeof Resources)[keyof typeof Resources];
export type Action = (typeof Actions)[keyof typeof Actions];

/**
 * Construye el string de permiso en formato "RECURSO:ACCION".
 */
export function buildPermission(resource: Resource, action: Action): string {
  return `${resource}:${action}`;
}

/**
 * Roles predefinidos del sistema según requisitos.
 */
export const SystemRoles = {
  CAJERO: "CAJERO",
  SUPERVISOR: "SUPERVISOR",
  TESORERIA: "TESORERIA",
  AUDITOR: "AUDITOR",
  ADMIN: "ADMIN",
} as const;

export type SystemRole = (typeof SystemRoles)[keyof typeof SystemRoles];
