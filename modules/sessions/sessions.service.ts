import { SessionRepository } from "./sessions.repository";
import { CreateSessionDto } from "./sessions.dto";
import { SessionNotFoundError } from "./sessions.errors";

export class SessionsService {
  constructor(private repo: SessionRepository) {}

  async create(dto: CreateSessionDto) {
    return this.repo.create(dto);
  }

  async list() {
    return this.repo.list();
  }

  async get(id: string) {
    const session = await this.repo.findById(id);
    if (!session) throw new SessionNotFoundError();
    return session;
  }

  async delete(id: string) {
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new SessionNotFoundError();
    return true;
  }
}