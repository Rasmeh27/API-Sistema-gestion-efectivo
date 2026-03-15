// ---lOGIN ------------------------------------

export interface LoginRequestDto { 
    email: string; 
    password: string;
}

export interface LoginResponseDto {
    accessToken: string; 
    refreshToken: string;
    expiresIn: number;
}

// ---- Refresh Token --------------------------------

export interface RefreshRequestDto {
    refreshToken: string;
}

export interface RefreshResponseDto {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}


// ---- Logout --------------------------------

export interface LogoutRequestDto {
    refreshToken: string;
}

// ---- Parsers --------------------------------

function requireObject(body: unknown): Record<string, unknown> {
    if(!body || typeof body !== "object" || Array.isArray(body)) {
        throw new Error("El cuerpo de la solicitud debe ser un objeto JSON");
    }
    return body as Record<string, unknown>;
}

function requireNonEmptyString(
    value: unknown,
    fieldName: string
): string {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error(`El campo ${fieldName} es obligatorio y no puede estar vacío`);
    }
    return value.trim();
}

export function parseLoginRequest(body: unknown): LoginRequestDto {
  const data = requireObject(body);

  return {
    email: requireNonEmptyString(data.email, "email").toLowerCase(),
    password: requireNonEmptyString(data.password, "password"),
  };
}

export function parseRefreshRequest(body: unknown): RefreshRequestDto {
  const data = requireObject(body);

  return {
    refreshToken: requireNonEmptyString(data.refreshToken, "refreshToken"),
  };
}

export function parseLogoutRequest(body: unknown): LogoutRequestDto {
  const data = requireObject(body);

  return {
    refreshToken: requireNonEmptyString(data.refreshToken, "refreshToken"),
  };
}