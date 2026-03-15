// modules/users/users.memory-repository.ts

import {
  CreateUserDto,
  UpdateUserDto,
  UserRecord,
  UserStatus,
} from "./users.dto";
import { UserRepository } from "./users.repository";

export class InMemoryUserRepository implements UserRepository {
  private readonly byId = new Map<string, UserRecord>();
  private readonly byEmail = new Map<string, UserRecord>();
  private nextId = 1;

  async create(
    user: CreateUserDto & { status: UserStatus; passwordHash: string }
  ): Promise<UserRecord> {
    const email = user.email.toLowerCase();

    if (this.byEmail.has(email)) {
      throw new Error("EMAIL_CONFLICT");
    }

    const record: UserRecord = {
      id: String(this.nextId++),
      name: user.name,
      email,
      status: user.status,
      sucursalDefaultId: user.sucursalDefaultId ?? null,
      roleIds: user.roleIds ?? [],
    };

    this.byId.set(record.id, record);
    this.byEmail.set(email, record);
    return { ...record };
  }

  async findById(id: string): Promise<UserRecord | null> {
    const record = this.byId.get(id);
    return record ? { ...record } : null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const record = this.byEmail.get(email.toLowerCase());
    return record ? { ...record } : null;
  }

  async update(
    id: string,
    patch: UpdateUserDto
  ): Promise<UserRecord | null> {
    const existing = this.byId.get(id);
    if (!existing) return null;

    if (patch.email && patch.email !== existing.email) {
      const normalized = patch.email.toLowerCase();
      if (this.byEmail.has(normalized)) {
        throw new Error("EMAIL_CONFLICT");
      }
      this.byEmail.delete(existing.email);
      existing.email = normalized;
      this.byEmail.set(normalized, existing);
    }

    if (patch.name !== undefined) existing.name = patch.name;
    if (patch.roleIds !== undefined) existing.roleIds = patch.roleIds;
    if (patch.status !== undefined) existing.status = patch.status;
    if (patch.sucursalDefaultId !== undefined) {
      existing.sucursalDefaultId = patch.sucursalDefaultId;
    }

    return { ...existing };
  }

  async updateStatus(
    id: string,
    status: UserStatus
  ): Promise<UserRecord | null> {
    const existing = this.byId.get(id);
    if (!existing) return null;

    existing.status = status;
    return { ...existing };
  }

  async list(
    offset: number,
    limit: number,
    status?: UserStatus,
    roleIds?: string[]
  ): Promise<{ items: UserRecord[]; total: number }> {
    let items = Array.from(this.byId.values());

    if (status) {
      items = items.filter((u) => u.status === status);
    }

    if (roleIds && roleIds.length > 0) {
      items = items.filter((u) =>
        roleIds.some((r) => u.roleIds.includes(r))
      );
    }

    const total = items.length;
    const paged = items.slice(offset, offset + limit);

    return { items: paged.map((u) => ({ ...u })), total };
  }
}
