import { apiFetch } from '@/api/client';
import type { PlayerAbilityAggregate, PlayerAbilityRating } from '@/features/player-ratings/types';

export interface RatingsPageResponse {
  ratings: PlayerAbilityRating[];
  aggregates: PlayerAbilityAggregate[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export const getPlayerRatings = async (params: {
  page?: number;
  limit?: number;
  player_id?: number;
  season_id?: number;
}): Promise<RatingsPageResponse> => {
  const qs = new URLSearchParams();
  if (params.page) qs.append('page', String(params.page));
  if (params.limit) qs.append('limit', String(params.limit));
  if (params.player_id) qs.append('player_id', String(params.player_id));
  if (params.season_id) qs.append('season_id', String(params.season_id));
  return apiFetch(`/api/ratings?${qs}`);
};

export const createPlayerRating = async (data: {
  player_id: number;
  season_id?: number;
  overall_rating?: number;
  comment?: string;
  [key: string]: unknown;
}): Promise<PlayerAbilityRating> => {
  return apiFetch('/api/ratings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getPlayerRatingAggregates = async (
  playerId: number,
  seasonId?: number
): Promise<PlayerAbilityAggregate[]> => {
  const qs = new URLSearchParams({ player_id: String(playerId) });
  if (seasonId) qs.append('season_id', String(seasonId));
  return apiFetch(`/api/all-ratings?${qs}`);
};
