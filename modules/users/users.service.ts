import { CreateUserDto, UpdateUserDto } from "./users.dto";
import { UserErrors } from "./users.errors";
import { UserRepository } from "./users.repository";

export class UsersService {
  constructor(private readonly repo: UserRepository) {}

  async createUser(dto: CreateUserDto) {
    if (!dto.name || !dto.email) {
      throw new Error("Invalid payload");
    }

    const existing = await this.repo.findByEmail(dto.email);

    if (existing) {
      throw UserErrors.emailConflict();
    }

    try {
      return await this.repo.create({
        ...dto,
        status: "ACTIVO",
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "EMAIL_CONFLICT") {
        throw UserErrors.emailConflict();
      }

      throw error;
    }
  }

  async listUsers(page = 1, perPage = 20, status?: string, roleIds?: string[]) {
    const currentPage = Math.max(1, page);
    const limit = Math.max(1, perPage);
    const offset = (currentPage - 1) * limit;

    return this.repo.list(offset, limit, status as any, roleIds);
  }

  async getUser(id: string) {
    const user = await this.repo.findById(id);

    if (!user) {
      throw UserErrors.notFound(id);
    }

    return user;
  }

  async updateUser(id: string, patch: UpdateUserDto) {
    try {
      const updated = await this.repo.update(id, patch);

      if (!updated) {
        throw UserErrors.notFound(id);
      }

      return updated;
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "EMAIL_CONFLICT") {
        throw UserErrors.emailConflict();
      }

      if (error instanceof Error && error.message === "INVALID_ROLE_IDS") {
        throw new Error("roleIds debe contener IDs numéricos válidos");
      }

      throw error;
    }
  }

  async updateUserStatus(id: string, status: "ACTIVO" | "INACTIVO") {
    const updated = await this.repo.updateStatus(id, status);

    if (!updated) {
      throw UserErrors.notFound(id);
    }

    return updated;
  }

  async deactivateUser(id: string) {
    const user = await this.repo.deactivate(id);

    if (!user) {
      throw UserErrors.notFound(id);
    }

    return user;
  }
}