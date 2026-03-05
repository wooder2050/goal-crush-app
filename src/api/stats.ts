import { apiFetch } from '@/api/client';
import type { PlayerVsTeamData } from '@/features/stats/types/player-vs-team';
import type { ScoringRankingsResponse } from '@/features/stats/types/scoring-rankings';
import type { WinRateResponse } from '@/features/stats/types/starter-win-rate';
import {
  PlayerMatchStats,
  PlayerSeasonStats,
  PlayerSeasonStatsWithNames,
  Standing,
  TeamSeasonStats,
} from '@/lib/types';

export interface TopRatedPlayerRow {
  player_id: number;
  player_name: string | null;
  player_image: string | null;
  team_id: number | null;
  team_name: string | null;
  team_logo: string | null;
  avg_rating: number;
  matches_rated: number;
}

export interface GoalkeeperRanking {
  rank: number;
  player_id: number;
  player_name: string;
  player_image: string | null;
  team_id: number | null;
  team_name: string | null;
  team_logo: string | null;
  matches_played: number;
  goals_conceded: number;
  clean_sheets: number;
  goals_conceded_per_match: string;
  clean_sheet_percentage: string;
  seasons?: string;
  teams?: string;
  team_logos?: string[];
  team_ids?: number[];
}

export interface GoalkeeperRankingsResponse {
  season_filter: number | 'all';
  sort_by: string;
  total_players: number;
  total_pages: number;
  current_page: number;
  per_page: number;
  rankings: GoalkeeperRanking[];
}

export interface TeamRanking {
  rank: number;
  team_id: number;
  team_name: string;
  team_logo?: string;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  win_rate: string;
  points: number;
  goals_for_per_match: string;
  goals_against_per_match: string;
  seasons: string;
}

export interface TeamRankingsResponse {
  season_filter: number | 'all';
  sort_by: string;
  total_teams: number;
  total_pages: number;
  current_page: number;
  per_page: number;
  rankings: TeamRanking[];
}

export interface HeadToHeadMatch {
  match_id: number;
  match_date: string;
  home_score: number;
  away_score: number;
  season_name: string;
  home_team_name: string;
  away_team_name: string;
  location?: string;
  penalty_home_score?: number;
  penalty_away_score?: number;
}

export interface HeadToHeadStats {
  team1_id: number;
  team2_id: number;
  team1_name: string;
  team2_name: string;
  team1_logo?: string;
  team2_logo?: string;
  total_matches: number;
  team1_wins: number;
  team2_wins: number;
  draws: number;
  team1_goals: number;
  team2_goals: number;
  recent_matches: HeadToHeadMatch[];
  biggest_win_team1: {
    match_date: string;
    score: string;
    season: string;
    margin: number;
  } | null;
  biggest_win_team2: {
    match_date: string;
    score: string;
    season: string;
    margin: number;
  } | null;
}

export interface TeamOption {
  team_id: number;
  team_name: string;
  logo?: string;
}

export interface KickerRanking {
  rank: number;
  player_id: number;
  player_name: string;
  player_image: string | null;
  total_kicks: number;
  successful_kicks: number;
  failed_kicks: number;
  success_rate: number;
  teams: string;
  team_logos: string[];
  first_team_id: number | null;
  first_team_name: string | null;
}

export interface GoalkeeperPKRanking {
  rank: number;
  player_id: number;
  player_name: string;
  player_image: string | null;
  total_faced: number;
  saves: number;
  conceded: number;
  save_rate: number;
  teams: string;
  team_logos: string[];
  first_team_id: number | null;
  first_team_name: string | null;
}

export interface PenaltyShootoutResponse {
  type: 'kicker' | 'goalkeeper';
  rankings: KickerRanking[] | GoalkeeperPKRanking[];
  total_players: number;
  current_page: number;
  total_pages: number;
  per_page: number;
}

export const getPlayerMatchStatsPrisma = async (matchId: number): Promise<PlayerMatchStats[]> => {
  return apiFetch(`/api/stats/player-match?match_id=${matchId}`);
};

export const getPlayerMatchStatsByPlayerPrisma = async (
  playerId: number
): Promise<PlayerMatchStats[]> => {
  return apiFetch(`/api/stats/player-match?player_id=${playerId}`);
};

export const getPlayerSeasonStatsPrisma = async (
  seasonId: number
): Promise<PlayerSeasonStats[]> => {
  return apiFetch(`/api/stats/player-season?season_id=${seasonId}`);
};

export const getPlayerSeasonStatsByPlayerPrisma = async (
  playerId: number
): Promise<PlayerSeasonStats[]> => {
  return apiFetch(`/api/stats/player-season?player_id=${playerId}`);
};

export const getTopScorersPrisma = async (
  seasonId: number,
  limit: number = 10
): Promise<PlayerSeasonStatsWithNames[]> => {
  return apiFetch(`/api/stats/player-season/top-scorers?season_id=${seasonId}&limit=${limit}`);
};

export const getTopAppearancesPrisma = async (
  seasonId: number,
  limit: number = 10
): Promise<PlayerSeasonStatsWithNames[]> => {
  return apiFetch(`/api/stats/player-season/top-appearances?season_id=${seasonId}&limit=${limit}`);
};

export const getTopAssistsPrisma = async (
  seasonId: number,
  limit: number = 10
): Promise<PlayerSeasonStatsWithNames[]> => {
  return apiFetch(`/api/stats/player-season/top-assists?season_id=${seasonId}&limit=${limit}`);
};

export const getTopRatingsPrisma = async (
  seasonId: number,
  limit: number = 10
): Promise<TopRatedPlayerRow[]> => {
  return apiFetch(`/api/stats/player-match/top-ratings?season_id=${seasonId}&limit=${limit}`);
};

export const getTopXtRatingsPrisma = async (
  seasonId: number,
  limit: number = 10
): Promise<TopRatedPlayerRow[]> => {
  return apiFetch(`/api/stats/player-match/top-xt-ratings?season_id=${seasonId}&limit=${limit}`);
};

export const getTeamSeasonStatsPrisma = async (seasonId: number): Promise<TeamSeasonStats[]> => {
  return apiFetch(`/api/stats/team-season?season_id=${seasonId}`);
};

export const getTeamSeasonStatsByTeamPrisma = async (
  teamId: number
): Promise<TeamSeasonStats[]> => {
  return apiFetch(`/api/stats/team-season?team_id=${teamId}`);
};

export const getStandingsPrisma = async (seasonId: number): Promise<Standing[]> => {
  return apiFetch(`/api/seasons/${seasonId}/standing`);
};

Object.defineProperty(getStandingsPrisma, 'queryKey', { value: 'standingsBySeason' });

export const getStandingsWithTeamPrisma = async (seasonId: number) => {
  return apiFetch(`/api/seasons/${seasonId}/standing`);
};

Object.defineProperty(getStandingsWithTeamPrisma, 'queryKey', {
  value: 'standingsWithTeamBySeason',
});

export const getGroupLeagueStandingsPrisma = async (
  seasonId: number,
  tournamentStage?: string,
  groupStage?: string
) => {
  const params = new URLSearchParams({ season_id: seasonId.toString() });
  if (tournamentStage && tournamentStage !== 'all')
    params.append('tournament_stage', tournamentStage);
  if (groupStage && groupStage !== 'all') params.append('group_stage', groupStage);
  return apiFetch(`/api/stats/group-league-standings?${params}`);
};

Object.defineProperty(getGroupLeagueStandingsPrisma, 'queryKey', {
  value: 'groupLeagueStanding',
});

// --- 통계 페이지용 API 함수 ---

export const getScoringRankings = async (params: {
  season_id?: number;
  page?: number;
  limit?: number;
  sort_by?: string;
  min_matches?: number;
}): Promise<ScoringRankingsResponse> => {
  const qs = new URLSearchParams();
  if (params.season_id) qs.append('season_id', String(params.season_id));
  if (params.page) qs.append('page', String(params.page));
  if (params.limit) qs.append('limit', String(params.limit));
  if (params.sort_by) qs.append('sort_by', params.sort_by);
  if (params.min_matches) qs.append('min_matches', String(params.min_matches));
  return apiFetch(`/api/stats/scoring-rankings?${qs}`);
};

export const getGoalkeeperRankings = async (params: {
  season_id?: number;
  page?: number;
  limit?: number;
  sort_by?: string;
  min_matches?: number;
}): Promise<GoalkeeperRankingsResponse> => {
  const qs = new URLSearchParams();
  if (params.season_id) qs.append('season_id', String(params.season_id));
  if (params.page) qs.append('page', String(params.page));
  if (params.limit) qs.append('limit', String(params.limit));
  if (params.sort_by) qs.append('sort_by', params.sort_by);
  if (params.min_matches) qs.append('min_matches', String(params.min_matches));
  return apiFetch(`/api/stats/goalkeeper-rankings?${qs}`);
};

export const getTeamRankings = async (params: {
  season_id?: number;
  page?: number;
  limit?: number;
  sort_by?: string;
}): Promise<TeamRankingsResponse> => {
  const qs = new URLSearchParams();
  if (params.season_id) qs.append('season_id', String(params.season_id));
  if (params.page) qs.append('page', String(params.page));
  if (params.limit) qs.append('limit', String(params.limit));
  if (params.sort_by) qs.append('sort_by', params.sort_by);
  return apiFetch(`/api/stats/team-rankings?${qs}`);
};

export const getHeadToHead = async (
  team1Id: number,
  team2Id: number,
  limit: number = 10
): Promise<HeadToHeadStats> => {
  return apiFetch(`/api/stats/head-to-head?team1_id=${team1Id}&team2_id=${team2Id}&limit=${limit}`);
};

export const getTeamOptions = async (): Promise<TeamOption[]> => {
  const res = await apiFetch<{ data: TeamOption[] }>('/api/teams');
  return res.data;
};

export const getPlayerVsTeam = async (
  playerId: number,
  seasonId?: number
): Promise<PlayerVsTeamData> => {
  const qs = new URLSearchParams({ player_id: String(playerId) });
  if (seasonId) qs.append('season_id', String(seasonId));
  return apiFetch(`/api/stats/player-vs-team?${qs}`);
};

export const getStarterWinRate = async (params: {
  season_id?: number;
  page?: number;
  limit?: number;
  sort_by?: string;
  min_matches?: number;
  appearance_type?: string;
}): Promise<WinRateResponse> => {
  const qs = new URLSearchParams();
  if (params.season_id) qs.append('season_id', String(params.season_id));
  if (params.page) qs.append('page', String(params.page));
  if (params.limit) qs.append('limit', String(params.limit));
  if (params.sort_by) qs.append('sort_by', params.sort_by);
  if (params.min_matches) qs.append('min_matches', String(params.min_matches));
  if (params.appearance_type) qs.append('appearance_type', params.appearance_type);
  return apiFetch(`/api/stats/starter-win-rate?${qs}`);
};

export const getPenaltyShootout = async (params: {
  type: 'kicker' | 'goalkeeper';
  season_id?: number;
  page?: number;
  limit?: number;
  sort_by?: string;
}): Promise<PenaltyShootoutResponse> => {
  const qs = new URLSearchParams({ type: params.type });
  if (params.season_id) qs.append('season_id', String(params.season_id));
  if (params.page) qs.append('page', String(params.page));
  if (params.limit) qs.append('limit', String(params.limit));
  if (params.sort_by) qs.append('sort_by', params.sort_by);
  return apiFetch(`/api/stats/penalty-shootout?${qs}`);
};
