// modules/fund-requests/fund-requests.repository.ts

import {
  FundRequestRecord,
  ApprovalRecord,
  CreateFundRequestDto,
  ResolveRequestDto,
  ListFundRequestsQuery,
} from "./fund-requests.dto";

export interface FundRequestRepository {
  create(dto: CreateFundRequestDto, solicitadaPor: string): Promise<FundRequestRecord>;
  findById(id: string): Promise<FundRequestRecord | null>;
  list(filters: ListFundRequestsQuery): Promise<FundRequestRecord[]>;
  resolve(id: string, dto: ResolveRequestDto, aprobadaPor: string): Promise<FundRequestRecord | null>;
  createApproval(solicitudId: string, dto: ResolveRequestDto, usuarioId: string): Promise<ApprovalRecord>;
  findApprovalByRequestId(solicitudId: string): Promise<ApprovalRecord | null>;
}
