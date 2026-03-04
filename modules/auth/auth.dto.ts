export type LoginRequestDTO = {
    email: string; 
    password: string;
};

export type LoginResponseDTO = {
    accestoken: string;
};

export function parseLoginRequest(body: unknown): LoginRequestDTO { 
    if (!body || typeof body !== "object") {
        throw new Error("Cuerpo debe ser un objeto.");
    }

    const email = (body as any).email;
    const password = (body as any).password;

    if (typeof email !== "string" || email.trim().length === 0) {
        throw new Error ("email es requerido");
    }

    if (typeof password !== "string" || password.trim().length === 0) {
        throw new Error ("password es requerido");
    }

    return { email: email.trim().toLowerCase(), password };
}

