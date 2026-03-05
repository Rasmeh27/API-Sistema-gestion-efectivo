import { v4 as uuidv4 } from "uuid";
import { CreateUserDto, UpdateUserDto, UserRecord } from "./users.dto";
import { UserRepository } from "./users.repository";

export class NotFoundError extends Error {
	public readonly statusCode = 404;
	constructor(message: string) {
		super(message);
	}
}

export class ConflictError extends Error {
	public readonly statusCode = 409;
	constructor(message: string) {
		super(message);
	}
}

export class UsersService {
	constructor(private readonly repo: UserRepository) {}

	async createUser(dto: CreateUserDto): Promise<UserRecord> {
		// basic validation
		if (!dto.name || !dto.email) throw new Error("Invalid payload");

		// uniqueness
		const existing = await this.repo.findByEmail(dto.email);
		if (existing) throw new ConflictError("Email already in use");

		const id = uuidv4();
		const toCreate = { ...dto, id, status: "ACTIVO" as const };
		try {
			return await this.repo.create(toCreate);
		} catch (err: any) {
			if (err?.message === "EMAIL_CONFLICT") throw new ConflictError("Email already in use");
			throw err;
		}
	}

	async listUsers(page = 1, perPage = 20) {
		const p = Math.max(1, page);
		const l = Math.max(1, perPage);
		const offset = (p - 1) * l;
		return this.repo.list(offset, l);
	}

	async getUser(id: string) {
		const u = await this.repo.findById(id);
		if (!u) throw new NotFoundError("User not found");
		return u;
	}

	async updateUser(id: string, patch: UpdateUserDto) {
		try {
			const updated = await this.repo.update(id, patch as any);
			if (!updated) throw new NotFoundError("User not found");
			return updated;
		} catch (err: any) {
			if (err?.message === "EMAIL_CONFLICT") throw new ConflictError("Email already in use");
			throw err;
		}
	}

	async deactivateUser(id: string) {
		const u = await this.repo.deactivate(id);
		if (!u) throw new NotFoundError("User not found");
		return u;
	}
}
