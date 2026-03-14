import { CreateSessionDto, SessionRecord } from "./sessions.dto";

export interface SessionRepository {
  create(dto: CreateSessionDto): Promise<SessionRecord>;
  findById(id: string): Promise<SessionRecord | null>;
  list(): Promise<SessionRecord[]>;
  delete(id: string): Promise<boolean>;
}