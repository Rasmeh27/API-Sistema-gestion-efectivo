export class UserError extends Error {
    public readonly status: number;
    public readonly Code: string;

    constructor(message: string, code: string, status: number) {
        super(message);
        this.Code = code;
        this.status = status;
    }
}

export const UserErrors = {
    notFound: (id: string) =>
        new UserError(`Usuario ${id} no encontrado`, "USER_NOT_FOUND", 404),

    emailConflict: () =>
        new UserError("Email ya en uso", "USER_EMAIL_CONFLICT", 409),
};
