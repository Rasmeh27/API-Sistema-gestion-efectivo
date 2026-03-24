// modules/recommendations/recommendations.repository.ts

import {
  RecommendationRecord,
  CreateRecommendationDto,
  UpdateRecommendationDto,
  ListRecommendationsQuery,
} from "./recommendations.dto";

export interface RecommendationRepository {
  create(dto: CreateRecommendationDto): Promise<RecommendationRecord>;
  createMany(dtos: CreateRecommendationDto[]): Promise<RecommendationRecord[]>;
  findById(id: string): Promise<RecommendationRecord | null>;
  list(filters: ListRecommendationsQuery): Promise<RecommendationRecord[]>;
  update(id: string, dto: UpdateRecommendationDto): Promise<RecommendationRecord | null>;
}
