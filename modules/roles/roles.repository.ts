// modules/roles/roles.repository.ts

import { CreateRoleDto, RoleRecord, UpdateRoleDto } from "./roles.dto";

export interface RoleRepository {
  create(dto: CreateRoleDto): Promise<RoleRecord>;
  findById(id: string): Promise<RoleRecord | null>;
  findByName(name: string): Promise<RoleRecord | null>;
  list(): Promise<RoleRecord[]>;
  update(id: string, dto: UpdateRoleDto): Promise<RoleRecord | null>;
  delete(id: string): Promise<boolean>;
  countPermissionsByIds(ids: string[]): Promise<number>;
  isAssignedToUsers(roleId: string): Promise<boolean>;
}
