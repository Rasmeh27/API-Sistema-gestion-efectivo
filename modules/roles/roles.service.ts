// modules/roles/roles.service.ts

import { CreateRoleDto, RoleRecord, UpdateRoleDto } from "./roles.dto";
import { RoleErrors } from "./roles.errors";
import { RoleRepository } from "./roles.repository";
import { AuditLogger } from "../audit/audit.logger";

export class RolesService {
  constructor(
    private readonly roles: RoleRepository,
    private readonly audit: AuditLogger
  ) {}

  async create(dto: CreateRoleDto): Promise<RoleRecord> {
    await this.ensureNameAvailable(dto.nombre);
    await this.ensurePermissionsExist(dto.permissionsIds);

    const role = await this.roles.create(dto);

    await this.audit.log({
      accion: "ROL_CREADO",
      entidadTipo: "ROL",
      entidadId: role.id,
      resumen: `Rol creado: ${role.nombre}`,
      afterJson: JSON.stringify({ nombre: role.nombre, permissions: role.permissions }),
    });

    return role;
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

    const before = await this.roles.findById(id);
    const updated = await this.roles.update(id, dto);

    if (!updated) {
      throw RoleErrors.notFound(id);
    }

    await this.audit.log({
      accion: "PERMISOS_MODIFICADOS",
      entidadTipo: "ROL",
      entidadId: id,
      resumen: `Rol editado: ${updated.nombre}`,
      beforeJson: before ? JSON.stringify({ nombre: before.nombre, permissions: before.permissions }) : undefined,
      afterJson: JSON.stringify({ nombre: updated.nombre, permissions: updated.permissions }),
    });

    return updated;
  }

  async delete(id: string): Promise<void> {
    const inUse = await this.roles.isAssignedToUsers(id);

    if (inUse) {
      throw RoleErrors.roleInUse();
    }

    const role = await this.roles.findById(id);
    const deleted = await this.roles.delete(id);

    if (!deleted) {
      throw RoleErrors.notFound(id);
    }

    await this.audit.log({
      accion: "ROL_ELIMINADO",
      entidadTipo: "ROL",
      entidadId: id,
      resumen: `Rol eliminado: ${role?.nombre ?? id}`,
      beforeJson: role ? JSON.stringify({ nombre: role.nombre }) : undefined,
    });
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
