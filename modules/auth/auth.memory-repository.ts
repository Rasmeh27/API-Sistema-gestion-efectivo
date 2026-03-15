// modules/auth/auth.memory-repository.ts

import { AuthUserRecord, AuthUserRepository } from "./auth.repository";

export class InMemoryAuthUserRepository implements AuthUserRepository {
  private readonly users: Map<string, AuthUserRecord>;

  constructor(seed: AuthUserRecord[] = []) {
    this.users = new Map(seed.map((user) => [user.email, user]));
  }

  async findByEmail(email: string): Promise<AuthUserRecord | null> {
    return this.users.get(email.toLowerCase()) ?? null;
  }

  async findById(id: string): Promise<AuthUserRecord | null> {
    for (const user of this.users.values()) {
      if (user.id === id) return user;
    }
    return null;
  }
}
