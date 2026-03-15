// modules/users/users.repository.ts

import { CreateUserDto, UpdateUserDto, UserRecord, UserStatus } from "./users.dto";

export interface UserRepository {
  create(
    user: CreateUserDto & { status: UserStatus; passwordHash: string }
  ): Promise<UserRecord>;

  findById(id: string): Promise<UserRecord | null>;

  findByEmail(email: string): Promise<UserRecord | null>;

  update(id: string, patch: UpdateUserDto): Promise<UserRecord | null>;

  list(
    offset: number,
    limit: number,
    status?: UserStatus,
    roleIds?: string[]
  ): Promise<{ items: UserRecord[]; total: number }>;

  updateStatus(id: string, status: UserStatus): Promise<UserRecord | null>;
}
