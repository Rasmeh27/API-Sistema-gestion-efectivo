// modules/users/users.service.ts

import { PasswordService } from "../auth/auth.password-service";
import {
  CreateUserDto,
  ListUsersQuery,
  UpdateUserDto,
  UserRecord,
  UserStatus,
} from "./users.dto";
import { UserErrors } from "./users.errors";
import { UserRepository } from "./users.repository";
import { AuditLogger } from "../audit/audit.logger";

export class UsersService {
  constructor(
    private readonly users: UserRepository,
    private readonly passwords: PasswordService,
    private readonly audit: AuditLogger
  ) {}

  async create(dto: CreateUserDto): Promise<UserRecord> {
    await this.ensureEmailAvailable(dto.email);

    const passwordHash = await this.passwords.hash(dto.password);

    const user = await this.users.create({
      ...dto,
      status: "ACTIVO",
      passwordHash,
    });

    await this.audit.log({
      usuarioId: user.id,
      accion: "USUARIO_CREADO",
      entidadTipo: "USUARIO",
      entidadId: user.id,
      resumen: `Usuario creado: ${user.email}`,
      afterJson: JSON.stringify({ name: user.name, email: user.email, roleIds: user.roleIds }),
    });

    return user;
  }

  async list(query: ListUsersQuery): Promise<{
    items: UserRecord[];
    total: number;
  }> {
    const offset = (query.page - 1) * query.perPage;

    return this.users.list(
      offset,
      query.perPage,
      query.status,
      query.roleIds
    );
  }

  async getById(id: string): Promise<UserRecord> {
    const user = await this.users.findById(id);

    if (!user) {
      throw UserErrors.notFound(id);
    }

    return user;
  }

  async update(id: string, patch: UpdateUserDto): Promise<UserRecord> {
    if (patch.email) {
      await this.ensureEmailAvailableForUpdate(patch.email, id);
    }

    const before = await this.users.findById(id);
    const updated = await this.users.update(id, patch);

    if (!updated) {
      throw UserErrors.notFound(id);
    }

    await this.audit.log({
      usuarioId: id,
      accion: "USUARIO_EDITADO",
      entidadTipo: "USUARIO",
      entidadId: id,
      resumen: `Usuario editado: ${updated.email}`,
      beforeJson: before ? JSON.stringify({ name: before.name, email: before.email, roleIds: before.roleIds }) : undefined,
      afterJson: JSON.stringify({ name: updated.name, email: updated.email, roleIds: updated.roleIds }),
    });

    return updated;
  }

  async updateStatus(
    id: string,
    status: UserStatus
  ): Promise<UserRecord> {
    const before = await this.users.findById(id);
    const updated = await this.users.updateStatus(id, status);

    if (!updated) {
      throw UserErrors.notFound(id);
    }

    await this.audit.log({
      usuarioId: id,
      accion: "USUARIO_EDITADO",
      entidadTipo: "USUARIO",
      entidadId: id,
      resumen: `Estado de usuario cambiado a ${status}`,
      beforeJson: before ? JSON.stringify({ status: before.status }) : undefined,
      afterJson: JSON.stringify({ status }),
    });

    return updated;
  }

  async deactivate(id: string): Promise<UserRecord> {
    return this.updateStatus(id, "BLOQUEADO");
  }

  // ── Privados ──────────────────────────────────────────

  private async ensureEmailAvailable(email: string): Promise<void> {
    const existing = await this.users.findByEmail(email);

    if (existing) {
      throw UserErrors.emailConflict();
    }
  }

  private async ensureEmailAvailableForUpdate(
    email: string,
    userId: string
  ): Promise<void> {
    const existing = await this.users.findByEmail(email);

    if (existing && existing.id !== userId) {
      throw UserErrors.emailConflict();
    }
  }
}
