
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
    permissionsIds:string[];
};

export type UpdateRoleDto = {
    nombre?: string;
    permissionsIds?: string[];
};

function requireObject(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("Payload invalido");
    }
    return value as Record<string, unknown>;
}

function normalizeString(value: unknown, fieldName: string): string {
    if(typeof value !== "string") {
        throw new Error(`El campo ${fieldName} debe ser una cadena de texto`);
    }
    const normalized = value.trim();    

    if(!normalized) {
        throw new Error(`El campo ${fieldName} no puede estar vacío`);
    }
    return normalized;
}

function normalizeStringArray(value: unknown, fieldName: string): string[] {
    if(!Array.isArray(value)) {
        throw new Error(`El campo ${fieldName} debe ser un arreglo`);
    }

    const normalized = value.map((item) => normalizeString(item, fieldName));

    return [...new Set(normalized)]; // Eliminar duplicados
}

export function parseCreateRole(input: unknown): CreateRoleDto {
    const payload = requireObject(input);

    return {
        nombre: normalizeString(payload.nombre, "nombre").toUpperCase(),
        permissionsIds: payload.permissionsIds ? normalizeStringArray(payload.permissionsIds, "permissionsIds") : [],
    };
}

export function parseUpdateRole(input: unknown): UpdateRoleDto {
    const payload = requireObject(input);
    const result: UpdateRoleDto = {};

    if("nombre" in payload && payload.nombre !== undefined) {
        result.nombre = normalizeString(payload.nombre, "nombre").toUpperCase();
    }

    if("permissionsIds" in payload && payload.permissionsIds !== undefined) {
        result.permissionsIds = normalizeStringArray(payload.permissionsIds, "permissionsIds");
    }

    if(Object.keys(result).length === 0) {
        throw new Error("Al menos un campo debe ser proporcionado para actualizar el rol");
    }

    return result;
}