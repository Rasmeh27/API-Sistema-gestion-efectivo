// modules/auth/auth.password-service.ts

import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export interface PasswordService {
  compare(plain: string, hash: string): Promise<boolean>;
  hash(plain: string): Promise<string>;
}

export class BcryptPasswordService implements PasswordService {
  async compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, SALT_ROUNDS);
  }
}
