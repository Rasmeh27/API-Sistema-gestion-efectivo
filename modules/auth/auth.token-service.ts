import Jwt  from "jsonwebtoken";

export type TokenPayload = {
    sub: string;
    email: string; 
    roleId: string[];
}

export interface TokenService {
    signAccessToken(payload: TokenPayload): string;
}

export class JwtTokenService implements TokenService {
    private readonly secret: string; 
    private readonly expiresIn: string;

    constructor(params: {secret: string; expiresIn: string}) {
        this.secret = params.secret;
        this.expiresIn = params.expiresIn;
    }

    signAccessToken(payload: TokenPayload): string {
        return Jwt.sign(payload, this.secret, {
            expiresIn: this.expiresIn as any,
        });
    }
}