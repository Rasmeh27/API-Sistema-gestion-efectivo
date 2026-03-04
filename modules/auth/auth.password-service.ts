import bcrypt from "bcryptjs";

export interface PasswordService {
    compare(plain: string, hash: string): Promise<boolean>;
}

export class BcryptPasswordService implements PasswordService {
    async compare(plain: string, hash: string): Promise<boolean> {
        return bcrypt.compare(plain, hash);
    }
}