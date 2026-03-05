export type UserStatus = "ACTIVO" | "INACTIVO";

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  roleIds: string[];
};

export type CreateUserDto = {
  name: string;
  email: string;
  roleIds?: string[];
};

export type UpdateUserDto = Partial<{
  name: string;
  email: string;
  roleIds: string[];
}>;

// helpers para validar/parsear peticiones HTTP
export function parseCreateUser(body: unknown): CreateUserDto {
    if (!body || typeof body !== "object") {
        throw new Error("Cuerpo debe ser un objeto.");
    }
    const name = (body as any).name;
    const email = (body as any).email;
    const roleIds = (body as any).roleIds;

    if (typeof name !== "string" || name.trim().length === 0) {
        throw new Error("name es requerido");
    }
    if (typeof email !== "string" || email.trim().length === 0) {
        throw new Error("email es requerido");
    }
    const roles = Array.isArray(roleIds) ? roleIds.map(String) : undefined;
    return { name: name.trim(), email: email.trim().toLowerCase(), roleIds: roles };
}

export function parseUpdateUser(body: unknown): UpdateUserDto {
    if (!body || typeof body !== "object") {
        throw new Error("Cuerpo debe ser un objeto.");
    }
    const patch: UpdateUserDto = {};
    if ("name" in (body as any)) {
        const n = (body as any).name;
        if (typeof n !== "string" || n.trim().length === 0) {
            throw new Error("name debe ser string");
        }
        patch.name = n.trim();
    }
    if ("email" in (body as any)) {
        const e = (body as any).email;
        if (typeof e !== "string" || e.trim().length === 0) {
            throw new Error("email debe ser string");
        }
        patch.email = e.trim().toLowerCase();
    }
    if ("roleIds" in (body as any)) {
        const r = (body as any).roleIds;
        if (!Array.isArray(r)) {
            throw new Error("roleIds debe ser array");
        }
        patch.roleIds = r.map(String);
    }
    return patch;
}

