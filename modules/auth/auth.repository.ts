// modules/auth/auth.repository.ts

export type AuthUserStatus = "ACTIVO" | "BLOQUEADO";

export interface AuthUserRecord {
  id: string;
  email: string;
  passwordHash: string;
  roles: string[];
  permissions: string[];
  status: AuthUserStatus;
}

export interface AuthUserRepository {
  findByEmail(email: string): Promise<AuthUserRecord | null>;
  findById(id: string): Promise<AuthUserRecord | null>;
}
