export class RoleError extends Error {
    constructor(
        public readonly code: string, 
        public readonly status: number,
        message: string
     ) {
        super(message);
     }                
}

export const RoleErrors = {
    notFound: (id: string) => new RoleError("ROLE_NOT_FOUND", 404, `No se encontró el rol con id ${id}`),
    nameConflict: (name: string) =>
        new RoleError("ROLE_NAME_CONFLICT", 409, `Ya existe un rol con el nombre ${name}`),
    invalidPermissionsIds: () =>
        new RoleError("INVALID_PERMISSIONS_IDS", 400, "Uno o mas permssionsIds no existen"),
    roleInUse:() =>
        new RoleError("ROLE_IN_USE", 400, "No se puede eliminar el rol porque está asignado a uno o más usuarios"), 
}