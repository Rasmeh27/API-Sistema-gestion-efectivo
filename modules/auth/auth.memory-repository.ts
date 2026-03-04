import { AuthUserRecord, AuthUserRepository } from "./auth.repository";

export class AuthUserMemoryRepository implements AuthUserRepository {
    private readonly usersByEmail: Map<string, AuthUserRecord>;

    constructor(seedUsers: AuthUserRecord[]) {
        this.usersByEmail = new Map(seedUsers.map(user => [user.email, user]));
    }

    async findByEmail(email: string): Promise<AuthUserRecord | null> {
        return this.usersByEmail.get(email) ?? null;
    }
}