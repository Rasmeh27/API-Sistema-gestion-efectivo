export type AuthUserRecord = {
    id: string;
    email: string;
    passwordHash: string;
    roleId: string[];
    status: "ACTIVO" | "INACTIVO";
};

export interface AuthUserRepository {
    findByEmail(email: string): Promise<AuthUserRecord | null>;
}