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

export class UsersService {
  constructor(
    private readonly users: UserRepository,
    private readonly passwords: PasswordService
  ) {}

  async create(dto: CreateUserDto): Promise<UserRecord> {
    await this.ensureEmailAvailable(dto.email);

    const passwordHash = await this.passwords.hash(dto.password);

    return this.users.create({
      ...dto,
      status: "ACTIVO",
      passwordHash,
    });
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

    const updated = await this.users.update(id, patch);

    if (!updated) {
      throw UserErrors.notFound(id);
    }

    return updated;
  }

  async updateStatus(
    id: string,
    status: UserStatus
  ): Promise<UserRecord> {
    const updated = await this.users.updateStatus(id, status);

    if (!updated) {
      throw UserErrors.notFound(id);
    }

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
