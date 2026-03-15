// modules/roles/roles.dto.ts

export type RolePermissionRecord = {
  id: string;
  recurso: string;
  accion: string;
};

export type RoleRecord = {
  id: string;
  nombre: string;
  permissions: RolePermissionRecord[];
};

export type CreateRoleDto = {
  nombre: string;
  permissionsIds: string[];
};

export type UpdateRoleDto = {
  nombre?: string;
  permissionsIds?: string[];
};

// ── Parsers ──────────────────────────────────────────────

function requireObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Payload inválido");
  }
  return value as Record<string, unknown>;
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new Error(`El campo ${field} debe ser una cadena de texto`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`El campo ${field} no puede estar vacío`);
  }
  return trimmed;
}

function optionalNonEmptyString(
  value: unknown,
  field: string
): string | undefined {
  if (value === undefined) return undefined;
  return requireNonEmptyString(value, field);
}

function parseStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`El campo ${field} debe ser un arreglo`);
  }
  const normalized = value.map((item) => requireNonEmptyString(item, field));
  return [...new Set(normalized)];
}

export function parseCreateRole(input: unknown): CreateRoleDto {
  const body = requireObject(input);

  return {
    nombre: requireNonEmptyString(body.nombre, "nombre").toUpperCase(),
    permissionsIds: body.permissionsIds
      ? parseStringArray(body.permissionsIds, "permissionsIds")
      : [],
  };
}

export function parseUpdateRole(input: unknown): UpdateRoleDto {
  const body = requireObject(input);
  const result: UpdateRoleDto = {};

  const nombre = optionalNonEmptyString(body.nombre, "nombre");
  if (nombre !== undefined) {
    result.nombre = nombre.toUpperCase();
  }

  if ("permissionsIds" in body && body.permissionsIds !== undefined) {
    result.permissionsIds = parseStringArray(
      body.permissionsIds,
      "permissionsIds"
    );
  }

  if (Object.keys(result).length === 0) {
    throw new Error(
      "Al menos un campo debe ser proporcionado para actualizar el rol"
    );
  }

  return result;
}
