import { query } from "../../db";
import { CreateTransactionDto, TransactionRecord, UpdateTransactionDto } from "./transactions.dto";

type TransactionRow = {
  id: string;
  user_id: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  description?: string | null;
  created_at: Date;
};

export interface TransactionRepository {
  create(dto: CreateTransactionDto): Promise<TransactionRecord>;
  findById(id: string): Promise<TransactionRecord | null>;
  list(): Promise<TransactionRecord[]>;
  update(id: string, dto: UpdateTransactionDto): Promise<TransactionRecord | null>;
  delete(id: string): Promise<boolean>;
}

export class PgTransactionRepository implements TransactionRepository {

  async create(dto: CreateTransactionDto): Promise<TransactionRecord> {

    const result = await query<TransactionRow>(
      `
      insert into transactions (user_id, amount, type, description)
      values ($1, $2, $3, $4)
      returning
        id::text as id,
        user_id,
        amount,
        type,
        description,
        created_at;
      `,
      [
        dto.userId,
        dto.amount,
        dto.type,
        dto.description ? dto.description.trim() : null
      ]
    );

    return this.map(result.rows[0]);
  }

  async findById(id: string): Promise<TransactionRecord | null> {

    const result = await query<TransactionRow>(
      `
      select
        id::text as id,
        user_id,
        amount,
        type,
        description,
        created_at
      from transactions
      where id = $1
      limit 1;
      `,
      [id]
    );

    const row = result.rows[0];
    return row ? this.map(row) : null;
  }

  async list(): Promise<TransactionRecord[]> {

    const result = await query<TransactionRow>(
      `
      select
        id::text as id,
        user_id,
        amount,
        type,
        description,
        created_at
      from transactions
      order by created_at desc;
      `
    );

    return result.rows.map((row) => this.map(row));
  }

  async update(id: string, dto: UpdateTransactionDto): Promise<TransactionRecord | null> {

    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const sets: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    if (dto.userId !== undefined) {
      sets.push(`user_id = $${index++}`);
      values.push(dto.userId);
    }

    if (dto.amount !== undefined) {
      sets.push(`amount = $${index++}`);
      values.push(dto.amount);
    }

    if (dto.type !== undefined) {
      sets.push(`type = $${index++}`);
      values.push(dto.type);
    }

    if (dto.description !== undefined) {
      sets.push(`description = $${index++}`);
      values.push(dto.description ? dto.description.trim() : null);
    }

    if (sets.length === 0) {
      return existing;
    }

    values.push(id);

    await query(
      `
      update transactions
      set ${sets.join(", ")}
      where id = $${index};
      `,
      values
    );

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {

    const result = await query(
      `
      delete from transactions
      where id = $1;
      `,
      [id]
    );

    return (result.rowCount ?? 0) > 0;
  }

  private map(row: TransactionRow): TransactionRecord {
    return {
      id: row.id,
      userId: row.user_id,
      amount: row.amount,
      type: row.type,
      description: row.description ?? undefined,
      createdAt: row.created_at
    };
  }
}