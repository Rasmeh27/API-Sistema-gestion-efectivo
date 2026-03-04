export class AuthError extends Error {
    public readonly Code: string;
    public readonly status: number;

    constructor(message: string, code: string, status: number) {
        super(message);
        this.Code = code;
        this.status = status;
    }
}

export const AuthErrors = {
    invalidCredentials: () => 
        new AuthError("Credenciales incorrectas", "INVALID_CREDENTIALS", 401),

    missingToken: () =>
        new AuthError("Falta de autenticacion", "AUTH_MISSING_TOKEN", 401), 

    invalidToken: () =>
        new AuthError("Token invalido", "AUTH_INVALID_TOKEN", 401),
}
