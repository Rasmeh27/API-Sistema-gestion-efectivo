import { CreateRoleDto, UpdateRoleDto } from "./roles.dto";
import { RoleErrors } from "./roles.errors";
import { RoleRepository } from "./role.repository";

export class RolesService { 
    constructor(private readonly repository: RoleRepository) {}

    async createRole(dto: CreateRoleDto) {
        const existing = await this.repository.findByName(dto.nombre);

        if(existing) {
            throw RoleErrors.nameConflict(dto.nombre);
        }

        const permissionCount = await this.repository.countPermissionsByIds(dto.permissionsIds);

        if(permissionCount !== dto.permissionsIds.length) {
            throw RoleErrors.invalidPermissionsIds();
        }
        return this.repository.create(dto);
    }

    async listRoles() {
        return this.repository.list();
    }

    async getRole(id: string) {
        const role = await this.repository.findById(id);

        if(!role) {
            throw RoleErrors.notFound(id);
        }
        return role;
    }

    async updateRole(id: string, dto: UpdateRoleDto) {
        if(dto.nombre) {
            const existing = await this.repository.findByName(dto.nombre);

            if(existing && existing.id !== id) {
                throw RoleErrors.nameConflict(dto.nombre);
            }
        }

        if(dto.permissionsIds) {
            const permissionCount = await this.repository.countPermissionsByIds(dto.permissionsIds);

            if(permissionCount !== dto.permissionsIds.length) {
                throw RoleErrors.invalidPermissionsIds();
            }
        }

        const updated = await this.repository.update(id, dto);

        if(!updated) {
            throw RoleErrors.notFound(id);
        }

        return updated;
    }

    async deleteRole(id: string) {
        const inUse = await this.repository.isAssignedToUsers(id);

        if(inUse) {
            throw RoleErrors.roleInUse();
        }

        const deleted = await this.repository.delete(id);

        if(!deleted) {
            throw RoleErrors.notFound(id);
        }

        return {
            success: true
        };
    }
}