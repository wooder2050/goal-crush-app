import { apiFetch } from '@/api/client';

// --- Types ---

export interface FantasySeasonItem {
  fantasy_season_id: number;
  season_id: number;
  year: number;
  month: number;
  start_date: string;
  end_date: string;
  lock_date: string;
  is_active: boolean;
  season_name?: string;
}

export interface FantasyPlayerSelection {
  player_id: number;
  position: string;
  name?: string;
  team_name?: string;
  team_logo?: string;
  profile_image_url?: string;
}

export interface FantasyTeam {
  fantasy_team_id: number;
  user_id: string;
  fantasy_season_id: number;
  team_name: string;
  total_points: number;
  created_at: string;
  updated_at: string;
  players: FantasyPlayerSelection[];
  season_name?: string;
}

export interface FantasyRanking {
  rank: number;
  fantasy_team_id: number;
  team_name: string;
  user_nickname: string;
  total_points: number;
  players: FantasyPlayerSelection[];
}

export interface AvailablePlayer {
  player_id: number;
  name: string;
  position: string;
  team_id: number;
  team_name: string;
  team_logo?: string;
  profile_image_url?: string;
  jersey_number?: number;
}

// --- API ---

export const getActiveFantasySeasons = async (): Promise<FantasySeasonItem[]> => {
  return apiFetch('/api/fantasy/seasons');
};

export const getFantasySeasonById = async (seasonId: number): Promise<FantasySeasonItem> => {
  return apiFetch(`/api/fantasy/seasons/${seasonId}`);
};

export const getMyFantasyTeam = async (fantasySeasonId: number): Promise<FantasyTeam | null> => {
  try {
    return await apiFetch(`/api/fantasy/teams/my-team?fantasy_season_id=${fantasySeasonId}`);
  } catch {
    return null;
  }
};

export const getUserFantasyTeams = async (): Promise<FantasyTeam[]> => {
  return apiFetch('/api/fantasy/teams');
};

export const createFantasyTeam = async (data: {
  fantasy_season_id: number;
  team_name?: string;
  players: Array<{ player_id: number; position: string }>;
}): Promise<FantasyTeam> => {
  return apiFetch('/api/fantasy/teams', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getFantasyRankings = async (
  seasonId: number,
  page: number = 1,
  limit: number = 20
): Promise<{
  rankings: FantasyRanking[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}> => {
  return apiFetch(`/api/fantasy/rankings/${seasonId}?page=${page}&limit=${limit}`);
};

export const getAvailablePlayers = async (seasonId: number): Promise<AvailablePlayer[]> => {
  return apiFetch(`/api/fantasy/players/available?season_id=${seasonId}`);
};
