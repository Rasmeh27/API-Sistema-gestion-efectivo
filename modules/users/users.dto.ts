// modules/users/users.dto.ts

// ── Tipos ───────────────────────────────────────────────

export type UserStatus = "ACTIVO" | "BLOQUEADO";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  sucursalDefaultId: string | null;
  roleIds: string[];
}

// ── DTOs ────────────────────────────────────────────────

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  sucursalDefaultId?: string;
  roleIds?: string[];
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  sucursalDefaultId?: string | null;
  roleIds?: string[];
  status?: UserStatus;
}

export interface UpdateUserStatusDto {
  status: UserStatus;
}

export interface ListUsersQuery {
  page: number;
  perPage: number;
  status?: UserStatus;
  roleIds?: string[];
}

// ── Helpers de parsing ──────────────────────────────────

const VALID_STATUSES: UserStatus[] = ["ACTIVO", "BLOQUEADO"];

function requireObject(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("El cuerpo de la solicitud debe ser un objeto JSON");
  }
  return body as Record<string, unknown>;
}

function requireNonEmptyString(
  value: unknown,
  fieldName: string
): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`El campo '${fieldName}' es requerido`);
  }
  return value.trim();
}

function optionalNonEmptyString(
  value: unknown,
  fieldName: string
): string | undefined {
  if (value === undefined || value === null) return undefined;

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`El campo '${fieldName}' debe ser un texto no vacío`);
  }

  return value.trim();
}

function optionalStringOrNull(
  value: unknown,
  fieldName: string
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`El campo '${fieldName}' debe ser un texto no vacío o null`);
  }

  return value.trim();
}

function parseRoleIds(value: unknown): string[] | undefined {
  if (value === undefined || value === null) return undefined;

  if (!Array.isArray(value)) {
    throw new Error("El campo 'roleIds' debe ser un array");
  }

  return value.map(String);
}

function parseStatus(value: unknown): UserStatus {
  if (!VALID_STATUSES.includes(value as UserStatus)) {
    throw new Error(
      `El campo 'status' debe ser uno de: ${VALID_STATUSES.join(", ")}`
    );
  }
  return value as UserStatus;
}

// ── Parsers de request ──────────────────────────────────

export function parseCreateUser(body: unknown): CreateUserDto {
  const data = requireObject(body);

  return {
    name: requireNonEmptyString(data.name, "name"),
    email: requireNonEmptyString(data.email, "email").toLowerCase(),
    password: requireNonEmptyString(data.password, "password"),
    sucursalDefaultId: optionalNonEmptyString(
      data.sucursalDefaultId,
      "sucursalDefaultId"
    ),
    roleIds: parseRoleIds(data.roleIds),
  };
}

export function parseUpdateUser(body: unknown): UpdateUserDto {
  const data = requireObject(body);
  const patch: UpdateUserDto = {};

  const name = optionalNonEmptyString(data.name, "name");
  if (name !== undefined) patch.name = name;

  const email = optionalNonEmptyString(data.email, "email");
  if (email !== undefined) patch.email = email.toLowerCase();

  const sucursalDefaultId = optionalStringOrNull(
    data.sucursalDefaultId,
    "sucursalDefaultId"
  );
  if (sucursalDefaultId !== undefined) {
    patch.sucursalDefaultId = sucursalDefaultId;
  }

  const roleIds = parseRoleIds(data.roleIds);
  if (roleIds !== undefined) patch.roleIds = roleIds;

  if (data.status !== undefined) {
    patch.status = parseStatus(data.status);
  }

  if (Object.keys(patch).length === 0) {
    throw new Error(
      "Debe proporcionar al menos un campo para actualizar"
    );
  }

  return patch;
}

export function parseUpdateUserStatus(
  body: unknown
): UpdateUserStatusDto {
  const data = requireObject(body);

  return {
    status: parseStatus(data.status),
  };
}

export function parseListUsersQuery(query: Record<string, unknown>): ListUsersQuery {
  const page = Math.max(1, Number(query.page ?? 1));
  const perPage = Math.min(100, Math.max(1, Number(query.perPage ?? 20)));

  const statusRaw = query.status as string | undefined;
  const status = statusRaw && VALID_STATUSES.includes(statusRaw as UserStatus)
    ? (statusRaw as UserStatus)
    : undefined;

  const roleIdsRaw = query.roleIds;
  const roleIds = roleIdsRaw
    ? Array.isArray(roleIdsRaw)
      ? (roleIdsRaw as string[])
      : [roleIdsRaw as string]
    : undefined;

  return { page, perPage, status, roleIds };
}
