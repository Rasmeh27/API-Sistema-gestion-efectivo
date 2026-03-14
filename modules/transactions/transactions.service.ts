import { CreateTransactionDto, UpdateTransactionDto } from "./transactions.dto";
import { TransactionError } from "./transactions.errors";
import { TransactionRepository } from "./transactions.repository";

export class TransactionsService {
  constructor(private readonly repo: TransactionRepository) {}

  async createTransaction(dto: CreateTransactionDto) {
    if (dto.amount <= 0) {
      throw TransactionError.createFailed();
    }

    try {
      return await this.repo.create(dto);
    } catch {
      throw TransactionError.createFailed();
    }
  }

  async listTransactions() {
    return this.repo.list();
  }

  async getTransaction(id: string) {
    const item = await this.repo.findById(id);
    if (!item) {
      throw TransactionError.notFound(id);
    }
    return item;
  }

  async updateTransaction(id: string, dto: UpdateTransactionDto) {
    try {
      const updated = await this.repo.update(id, dto);
      if (!updated) {
        throw TransactionError.updateFailed(id);
      }
      return updated;
    } catch {
      throw TransactionError.updateFailed(id);
    }
  }

  async deleteTransaction(id: string) {
    try {
      const deleted = await this.repo.delete(id);
      if (!deleted) {
        throw TransactionError.deleteFailed(id);
      }
      return { success: true };
    } catch {
      throw TransactionError.deleteFailed(id);
    }
  }
}