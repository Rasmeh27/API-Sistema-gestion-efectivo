// modules/roles/roles.service.ts

import { CreateRoleDto, RoleRecord, UpdateRoleDto } from "./roles.dto";
import { RoleErrors } from "./roles.errors";
import { RoleRepository } from "./roles.repository";

export class RolesService {
  constructor(private readonly roles: RoleRepository) {}

  async create(dto: CreateRoleDto): Promise<RoleRecord> {
    await this.ensureNameAvailable(dto.nombre);
    await this.ensurePermissionsExist(dto.permissionsIds);

    return this.roles.create(dto);
  }

  async list(): Promise<RoleRecord[]> {
    return this.roles.list();
  }

  async getById(id: string): Promise<RoleRecord> {
    const role = await this.roles.findById(id);

    if (!role) {
      throw RoleErrors.notFound(id);
    }

    return role;
  }

  async update(id: string, dto: UpdateRoleDto): Promise<RoleRecord> {
    if (dto.nombre) {
      await this.ensureNameAvailableForUpdate(dto.nombre, id);
    }

    if (dto.permissionsIds) {
      await this.ensurePermissionsExist(dto.permissionsIds);
    }

    const updated = await this.roles.update(id, dto);

    if (!updated) {
      throw RoleErrors.notFound(id);
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const inUse = await this.roles.isAssignedToUsers(id);

    if (inUse) {
      throw RoleErrors.roleInUse();
    }

    const deleted = await this.roles.delete(id);

    if (!deleted) {
      throw RoleErrors.notFound(id);
    }
  }

  // ── Privados ──────────────────────────────────────────

  private async ensureNameAvailable(name: string): Promise<void> {
    const existing = await this.roles.findByName(name);

    if (existing) {
      throw RoleErrors.nameConflict(name);
    }
  }

  private async ensureNameAvailableForUpdate(
    name: string,
    roleId: string
  ): Promise<void> {
    const existing = await this.roles.findByName(name);

    if (existing && existing.id !== roleId) {
      throw RoleErrors.nameConflict(name);
    }
  }

  private async ensurePermissionsExist(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const count = await this.roles.countPermissionsByIds(ids);

    if (count !== ids.length) {
      throw RoleErrors.invalidPermissionIds();
    }
  }
}
