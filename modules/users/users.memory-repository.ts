import { CreateUserDto, UpdateUserDto, UserRecord, UserStatus } from "./users.dto";
import { UserRepository } from "./users.repository";

export class UserMemoryRepository implements UserRepository {
  private readonly byId = new Map<string, UserRecord>();
  private readonly byEmail = new Map<string, UserRecord>();

  async create(user: CreateUserDto & { id: string; status: UserStatus }): Promise<UserRecord> {
    if (this.byEmail.has(user.email)) {
      throw new Error("EMAIL_CONFLICT");
    }
    const record: UserRecord = {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      roleIds: user.roleIds ?? [],
    };
    this.byId.set(record.id, record);
    this.byEmail.set(record.email, record);
    return record;
  }

  async findById(id: string): Promise<UserRecord | null> {
    return this.byId.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    return this.byEmail.get(email) ?? null;
  }

  async update(id: string, patch: UpdateUserDto): Promise<UserRecord | null> {
    
    const existing = this.byId.get(id);
    if (!existing) return null;

    if (patch.email && patch.email !== existing.email) {
      if (this.byEmail.has(patch.email)) {
        throw new Error("EMAIL_CONFLICT");
      }
      this.byEmail.delete(existing.email);
      existing.email = patch.email;
      this.byEmail.set(existing.email, existing);
    }

    if (patch.name) existing.name = patch.name;
    if (patch.roleIds) existing.roleIds = patch.roleIds;
    if (patch.status) existing.status = patch.status;

    this.byId.set(id, existing);
    return existing;
  }

  async updateStatus(id: string, status: UserStatus): Promise<UserRecord | null> {
    const existing = this.byId.get(id);
    if (!existing) return null;
    existing.status = status;
    this.byId.set(id, existing);
    return existing;
  }

  async list(offset: number, limit: number, status?: UserStatus, roleIds?: string[]): Promise<{ items: UserRecord[]; total: number }> {
    let items = Array.from(this.byId.values());
    if (status) items = items.filter(u => u.status === status);
    if (roleIds && roleIds.length > 0) {
      items = items.filter(u => roleIds.every(r => u.roleIds.includes(r)));
    }
    const total = items.length;
    const paged = items.slice(offset, offset + limit);
    return { items: paged, total };
  }

  async deactivate(id: string): Promise<UserRecord | null> {
    const existing = this.byId.get(id);
    if (!existing) return null;
    existing.status = "INACTIVO";
    this.byId.set(id, existing);
    return existing;
  }
}