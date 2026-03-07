import { UserRepository } from "./users.repository";
import { CreateUserDto, UserRecord } from "./users.dto";

export class UserMemoryRepository implements UserRepository {
  private readonly byId = new Map<string, UserRecord>();
  private readonly byEmail = new Map<string, UserRecord>();

  constructor(seed: UserRecord[] = []) {
    for (const u of seed) {
      this.byId.set(u.id, u);
      this.byEmail.set(u.email.toLowerCase(), u);
    }
  }

  async create(user: CreateUserDto & { id: string; status: UserRecord["status"] }): Promise<UserRecord> {
    const emailKey = user.email.toLowerCase();
    if (this.byEmail.has(emailKey)) {
      throw new Error("EMAIL_CONFLICT");
    }
    const rec: UserRecord = { id: user.id, name: user.name, email: user.email, status: user.status, roleIds: user.roleIds ?? [] };
    this.byId.set(rec.id, rec);
    this.byEmail.set(emailKey, rec);
    return rec;
  }

  async findById(id: string): Promise<UserRecord | null> {
    return this.byId.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    return this.byEmail.get(email.toLowerCase()) ?? null;
  }

  async update(id: string, patch: Partial<UserRecord>): Promise<UserRecord | null> {
    const existing = this.byId.get(id);
    if (!existing) return null;
    if (patch.email && patch.email.toLowerCase() !== existing.email.toLowerCase()) {
      const conflict = this.byEmail.get(patch.email.toLowerCase());
      if (conflict && conflict.id !== id) {
        throw new Error("EMAIL_CONFLICT");
      }
      this.byEmail.delete(existing.email.toLowerCase());
      existing.email = patch.email;
      this.byEmail.set(existing.email.toLowerCase(), existing);
    }
    if (patch.name !== undefined) existing.name = patch.name;
    if (patch.roleIds !== undefined) existing.roleIds = patch.roleIds;
    this.byId.set(id, existing);
    return existing;
  }

  async list(offset: number, limit: number, status?: string): Promise<{ items: UserRecord[]; total: number }> {
    let items = Array.from(this.byId.values()).sort((a, b) => a.id.localeCompare(b.id));
    if (status) {
      items = items.filter(u => u.status === status);
    }
    const slice = items.slice(offset, offset + limit);
    return { items: slice, total: items.length };
  }

  async deactivate(id: string): Promise<UserRecord | null> {
    const u = this.byId.get(id);
    if (!u) return null;
    u.status = "INACTIVO";
    this.byId.set(id, u);
    this.byEmail.set(u.email.toLowerCase(), u);
    return u;
  }
}
