// modules/fund-requests/fund-requests.service.ts

import { roundMoney } from "../../src/shared/utils/money";
import {
  FundRequestRecord,
  ApprovalRecord,
  CreateFundRequestDto,
  ResolveRequestDto,
  ListFundRequestsQuery,
} from "./fund-requests.dto";
import { FundRequestError } from "./fund-requests.errors";
import { FundRequestRepository } from "./fund-requests.repository";

export class FundRequestsService {
  constructor(
    private readonly requests: FundRequestRepository
  ) {}

  async create(
    dto: CreateFundRequestDto,
    solicitadaPor: string
  ): Promise<FundRequestRecord> {
    return this.requests.create(
      { ...dto, monto: roundMoney(dto.monto) },
      solicitadaPor
    );
  }

  async resolve(
    id: string,
    dto: ResolveRequestDto,
    aprobadaPor: string
  ): Promise<{ request: FundRequestRecord; approval: ApprovalRecord }> {
    const existing = await this.requests.findById(id);
    if (!existing) throw FundRequestError.notFound(id);
    if (existing.estado !== "PENDIENTE") throw FundRequestError.alreadyResolved();

    const request = await this.requests.resolve(id, dto, aprobadaPor);
    if (!request) throw FundRequestError.notFound(id);

    const approval = await this.requests.createApproval(id, dto, aprobadaPor);

    return { request, approval };
  }

  async getById(id: string): Promise<FundRequestRecord> {
    const request = await this.requests.findById(id);
    if (!request) throw FundRequestError.notFound(id);
    return request;
  }

  async list(filters: ListFundRequestsQuery): Promise<FundRequestRecord[]> {
    return this.requests.list(filters);
  }

  async getApproval(solicitudId: string): Promise<ApprovalRecord> {
    const request = await this.requests.findById(solicitudId);
    if (!request) throw FundRequestError.notFound(solicitudId);

    const approval = await this.requests.findApprovalByRequestId(solicitudId);
    if (!approval) throw FundRequestError.notFound(solicitudId);

    return approval;
  }
}
