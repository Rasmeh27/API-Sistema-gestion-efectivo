import { query, withTransaction } from "../../db";
import { CreateSessionDto, SessionRecord } from "./sessions.dto";
import { SessionRepository } from "./sessions.repository";
import { SessionCreateError } from "./sessions.errors";

type SessionRow = {
  id: string;
  user_id: string;
  token: string;
  created_at: Date;
  expires_at: Date;
};

export class PgSessionRepository implements SessionRepository {

  async create(dto: CreateSessionDto): Promise<SessionRecord> {
    return withTransaction(async (client) => {

      const sql = `
        insert into sessions (user_id, token, created_at, expires_at)
        values ($1, $2, now(), $3)
        returning id::text, user_id, token, created_at, expires_at;
      `;

      const result = await client.query<SessionRow>(sql, [
        dto.userId,
        dto.token.trim(),
        dto.expiresAt
      ]);

      const row = result.rows[0];
      if (!row) {
        throw new SessionCreateError();
      }

      return this.map(row);
    });
  }

  async findById(id: string): Promise<SessionRecord | null> {

    const sql = `
      select id::text, user_id, token, created_at, expires_at
      from sessions
      where id = $1
      limit 1;
    `;

    const result = await query<SessionRow>(sql, [id]);

    const row = result.rows[0];
    return row ? this.map(row) : null;
  }

  async list(): Promise<SessionRecord[]> {

    const sql = `
      select id::text, user_id, token, created_at, expires_at
      from sessions
      order by created_at desc;
    `;

    const result = await query<SessionRow>(sql);

    return result.rows.map((row) => this.map(row));
  }

  async delete(id: string): Promise<boolean> {

    const sql = `
      delete from sessions
      where id = $1;
    `;

    const result = await query(sql, [id]);

    return (result.rowCount ?? 0) > 0;
  }

  private map(row: SessionRow): SessionRecord {
    return {
      id: row.id,
      userId: row.user_id,
      token: row.token,
      createdAt: row.created_at,
      expiresAt: row.expires_at
    };
  }
}