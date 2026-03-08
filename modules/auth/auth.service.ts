import { AuthUserRepository } from "./auth.repository";
import { PasswordService } from "./auth.password-service";
import { TokenService } from "./auth.token-service";
import { AuthErrors } from "./auth.errors";

export class AuthService {
  constructor(
    private readonly users: AuthUserRepository,
    private readonly passwords: PasswordService,
    private readonly token: TokenService
  ) {}

  async authenticate(params: {
    email: string;
    password: string;
  }): Promise<{ accessToken: string }> {
    const email = params.email.trim().toLowerCase();
    const password = params.password;

    if (!email || !password) {
      throw AuthErrors.invalidCredentials();
    }

    const user = await this.users.findByEmail(email);

    if (!user) {
      throw AuthErrors.invalidCredentials();
    }

    if (user.status !== "ACTIVO") {
      throw AuthErrors.invalidCredentials();
    }

    if (!user.passwordHash) {
      throw AuthErrors.invalidCredentials();
    }

    const ok = await this.passwords.compare(password, user.passwordHash);

    if (!ok) {
      throw AuthErrors.invalidCredentials();
    }

    const accessToken = this.token.signAccessToken({
      sub: user.id,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
    });

    return { accessToken };
  }
}