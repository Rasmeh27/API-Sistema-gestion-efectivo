import { AuthUserRepository } from "./auth.repository";
import { PasswordService } from "./auth.password-service";
import { TokenService } from "./auth.token-service";
import { AuthError, AuthErrors } from "./auth.errors";


export class AuthService {
    constructor(
        private readonly users: AuthUserRepository,
        private readonly passwords: PasswordService,
        private readonly token: TokenService
    ) {}

    async authenticate(params: {email: string; password: string}): Promise<{accessToken: string}> {
        const user = await this.users.findByEmail(params.email);
        if (!user || user.status !== "ACTIVO") {
            throw AuthErrors.invalidCredentials();
        }

        const ok = await this.passwords.compare(params.password, user.passwordHash);
        if (!ok) {
            throw AuthErrors.invalidCredentials();
        }

        const accessToken = this.token.signAccessToken({
            sub: user.id,
            email: user.email,
            roleId: user.roleId,
        });

        return { accessToken };
    }
}