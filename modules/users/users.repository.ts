import { CreateUserDto, UpdateUserDto, UserRecord } from "./users.dto";

export interface UserRepository {
  create(user: CreateUserDto & { id: string; status: UserRecord["status"] }): Promise<UserRecord>;
  findById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  update(id: string, patch: UpdateUserDto): Promise<UserRecord | null>;
  list(offset: number, limit: number): Promise<{ items: UserRecord[]; total: number }>;
  deactivate(id: string): Promise<UserRecord | null>;
}
