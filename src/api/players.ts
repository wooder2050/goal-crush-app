import { apiFetch } from '@/api/client';
import { Player, PlayerWithTeam } from '@/lib/types';

export type PlayersPageItem = {
  player_id: number;
  name: string;
  jersey_number: number | null;
  profile_image_url: string | null;
  team: { team_id: number; team_name: string; logo: string | null } | null;
  position: string | null;
  created_at: string | null;
  updated_at: string | null;
  seasons: Array<{ season_name: string | null; year: number | null }>;
  totals: {
    appearances: number;
    goals: number;
    assists: number;
    goals_conceded: number;
  };
};

export type PlayersPageResponse = {
  items: PlayersPageItem[];
  nextPage: number | null;
  totalCount: number;
};

export const getPlayersPrisma = async (): Promise<Player[]> => {
  return apiFetch<Player[]>('/api/players');
};

Object.defineProperty(getPlayersPrisma, 'queryKey', { value: 'playersAll' });

export const getPlayersPagePrisma = async (
  page: number,
  limit: number,
  opts?: {
    teamId?: number;
    seasonId?: number;
    name?: string;
    order?: 'apps' | 'goals' | 'assists';
    position?: string;
  }
): Promise<PlayersPageResponse> => {
  const qs = new URLSearchParams();
  qs.set('page', String(page));
  qs.set('limit', String(limit));
  if (opts?.teamId) qs.set('team_id', String(opts.teamId));
  if (opts?.seasonId) qs.set('season_id', String(opts.seasonId));
  if (opts?.name) qs.set('name', opts.name);
  if (opts?.order) qs.set('order', opts.order);
  if (opts?.position) qs.set('position', opts.position);
  return apiFetch<PlayersPageResponse>(`/api/players?${qs.toString()}`);
};

Object.defineProperty(getPlayersPagePrisma, 'queryKey', { value: 'playersPage' });

export const getPlayersSummariesPrisma = async (
  playerIds: number[]
): Promise<
  Record<
    number,
    {
      seasons: Array<{ season_name: string | null; year: number | null }>;
      totals: { appearances: number; goals: number; assists: number; goals_conceded: number };
    }
  >
> => {
  const ids = playerIds.join(',');
  return apiFetch(`/api/players/summaries?ids=${ids}`);
};

Object.defineProperty(getPlayersSummariesPrisma, 'queryKey', { value: 'playersSummaries' });

export const getPlayerByIdPrisma = async (playerId: number): Promise<Player | null> => {
  try {
    return await apiFetch<Player>(`/api/players/${playerId}`);
  } catch {
    return null;
  }
};

Object.defineProperty(getPlayerByIdPrisma, 'queryKey', { value: 'playerById' });

export const getPlayerWithCurrentTeamPrisma = async (
  playerId: number
): Promise<PlayerWithTeam | null> => {
  try {
    return await apiFetch<PlayerWithTeam>(`/api/players/${playerId}/team`);
  } catch {
    return null;
  }
};

Object.defineProperty(getPlayerWithCurrentTeamPrisma, 'queryKey', { value: 'playerWithTeam' });

export const searchPlayersByNamePrisma = async (name: string): Promise<Player[]> => {
  return apiFetch<Player[]>(`/api/players?name=${encodeURIComponent(name)}`);
};

Object.defineProperty(searchPlayersByNamePrisma, 'queryKey', { value: 'playersByName' });

export const getPlayersByPositionPrisma = async (position: string): Promise<Player[]> => {
  return apiFetch<Player[]>(`/api/players?position=${encodeURIComponent(position)}`);
};

Object.defineProperty(getPlayersByPositionPrisma, 'queryKey', { value: 'playersByPosition' });

export const getPlayerSummaryPrisma = async (
  playerId: number,
  teamId?: number
): Promise<{
  player_id: number;
  seasons: Array<{
    season_id: number | null;
    season_name: string | null;
    year: number | null;
    team_id: number | null;
    team_name: string | null;
    team_logo: string | null;
    goals: number;
    assists: number;
    appearances: number;
    penalty_goals: number;
    positions: string[];
  }>;
  totals: { goals: number; assists: number; appearances: number; goals_conceded: number };
  totals_for_team?: {
    goals: number;
    assists: number;
    appearances: number;
    goals_conceded: number;
  };
  per_team_totals?: Array<{
    team_id: number;
    team_name: string | null;
    goals: number;
    assists: number;
    appearances: number;
    goals_conceded: number;
  }>;
  primary_position: string | null;
  positions_frequency?: Array<{ position: string; matches: number }>;
  team_history?: Array<{
    team_id: number | null;
    team_name: string | null;
    logo: string | null;
    primary_color: string | null;
    secondary_color: string | null;
    start_date: string | null;
    end_date: string | null;
    is_active?: boolean;
  }>;
  goal_matches?: Array<{
    match_id: number;
    match_date: string | null;
    season_id: number | null;
    season_name: string | null;
    team_id: number | null;
    team_name: string | null;
    team_logo: string | null;
    opponent_id: number | null;
    opponent_name: string | null;
    opponent_logo: string | null;
    player_goals: number;
    penalty_goals: number;
    home_score: number | null;
    away_score: number | null;
    penalty_home_score: number | null;
    penalty_away_score: number | null;
    is_home: boolean;
    tournament_stage: string | null;
  }>;
}> => {
  const qs = teamId ? `?team_id=${teamId}` : '';
  try {
    return await apiFetch(`/api/players/${playerId}/summary${qs}`);
  } catch {
    return {
      player_id: playerId,
      seasons: [],
      totals: { goals: 0, assists: 0, appearances: 0, goals_conceded: 0 },
      primary_position: null,
    };
  }
};

Object.defineProperty(getPlayerSummaryPrisma, 'queryKey', { value: 'playerSummary' });
