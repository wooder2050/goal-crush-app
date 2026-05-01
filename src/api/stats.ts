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

// --- 선수 비교 ---

export interface PlayerCompareStats {
  matches: number;
  goals: number;
  assists: number;
  attack_points: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  seasons_played: number;
}

export interface PlayerCompareData {
  player_id: number;
  name: string;
  profile_image_url: string | null;
  jersey_number: number | null;
  position: string | null;
  team_name: string | null;
  team_logo: string | null;
  team_color: string | null;
  stats: PlayerCompareStats;
}

export interface GoalTimingData {
  first_half: number;
  second_half: number;
  total: number;
}

export interface SeasonBreakdownEntry {
  season_id: number;
  season_name: string;
  player1: { goals: number; assists: number; matches: number };
  player2: { goals: number; assists: number; matches: number };
}

export interface CompareResponse {
  player1: PlayerCompareData;
  player2: PlayerCompareData;
  head_to_head: {
    total_matches: number;
    player1_wins: number;
    player2_wins: number;
  };
  goal_timing: {
    player1: GoalTimingData;
    player2: GoalTimingData;
  };
  season_breakdown: SeasonBreakdownEntry[];
}

export const getPlayerCompare = async (
  player1Id: number,
  player2Id: number,
  seasonId?: number | string
): Promise<CompareResponse> => {
  const qs = new URLSearchParams({
    player1_id: String(player1Id),
    player2_id: String(player2Id),
  });
  if (seasonId && seasonId !== 'all') qs.append('season_id', String(seasonId));
  return apiFetch(`/api/stats/player-compare?${qs}`);
};

Object.defineProperty(getPlayerCompare, 'queryKey', { value: 'playerCompare' });

// --- 파워 랭킹 ---

export interface PowerRankingBreakdown {
  label: string;
  normalized: number;
  weight: number;
  contribution: number;
  raw_value: string;
}

export interface PowerRankingRow {
  rank: number;
  player_id: number;
  name: string;
  profile_image_url: string | null;
  jersey_number: number | null;
  team_name: string;
  team_logo: string | null;
  team_color: string | null;
  position: string;
  power_index: number;
  matches: number;
  goals: number;
  assists: number;
  win_rate: number;
  avg_stats_rating: number | null;
  avg_xt_rating: number | null;
  action_per_match: number;
  clean_sheets: number;
  save_pct: number | null;
  breakdown: PowerRankingBreakdown[];
}

export interface PowerRankingData {
  rankings: PowerRankingRow[];
  season: { season_id: number; season_name: string } | null;
}

export const getPowerRanking = async (limit: number = 100): Promise<PowerRankingData> => {
  return apiFetch(`/api/stats/power-ranking?limit=${limit}`);
};

Object.defineProperty(getPowerRanking, 'queryKey', { value: 'powerRanking' });

// --- 방송 데이터 ---

export interface ViewershipRatingData {
  match_id: number;
  match_date: string;
  label: string;
  rating_nationwide: number | null;
  rating_metropolitan: number | null;
  broadcast_time: string | null;
  season: { season_id: number; season_name: string } | null;
}

export const getViewershipRatings = async (
  seasonId?: number
): Promise<ViewershipRatingData[]> => {
  const qs = seasonId ? `?seasonId=${seasonId}` : '';
  return apiFetch(`/api/stats/viewership-ratings${qs}`);
};

Object.defineProperty(getViewershipRatings, 'queryKey', { value: 'viewershipRatings' });

// --- 선수 패스맵 ---

export interface PassMapPass {
  action_id: number;
  period_id: 1 | 2;
  start_x: number;
  start_y: number;
  end_x: number;
  end_y: number;
  result: string;
  time_seconds: number;
}

export interface PassMapMatch {
  match_id: number;
  match_date: string;
  season_name: string;
  home_team_name: string;
  home_team_logo: string | null;
  away_team_name: string;
  away_team_logo: string | null;
  home_score: number | null;
  away_score: number | null;
  is_home: boolean;
  total_passes: number;
  successful_passes: number;
}

export interface PassMapData {
  matches: PassMapMatch[];
  match_id: number;
  flip_first_half: boolean;
  passes: PassMapPass[];
}

export const getPlayerPassMap = async (
  playerId: number,
  matchId?: number
): Promise<PassMapData> => {
  const qs = new URLSearchParams({ player_id: String(playerId) });
  if (matchId) qs.append('match_id', String(matchId));
  return apiFetch(`/api/stats/player-pass-map?${qs}`);
};

Object.defineProperty(getPlayerPassMap, 'queryKey', { value: 'playerPassMap' });

// --- 선수 특성 ---

export interface PlayerTraitsData {
  traits: {
    touches?: number;
    chance_creation?: number;
    shots?: number;
    goals?: number;
    defensive?: number;
    pass_accuracy?: number;
    gk_distribution?: number;
    clean_sheet?: number;
    goals_conceded?: number;
    saves?: number;
    clearances?: number;
    matches_analyzed: number;
    is_goalkeeper: boolean;
  };
}

export const getPlayerTraits = async (playerId: number): Promise<PlayerTraitsData> => {
  return apiFetch(`/api/stats/player-traits?player_id=${playerId}`);
};

Object.defineProperty(getPlayerTraits, 'queryKey', { value: 'playerTraits' });

// --- 시즌 상세 통계 ---

export interface StatItem {
  value: number;
  percentile: number;
  percentile_per_match: number;
}

export interface PlayerDetailedStatsResponse {
  seasons: Array<{ season_id: number; season_name: string; match_count: number }>;
  season_id: number;
  total_players: number;
  is_goalkeeper: boolean;
  data: {
    matches: number;
    shooting?: Record<string, StatItem>;
    passing?: Record<string, StatItem>;
    possession?: Record<string, StatItem>;
    defense?: Record<string, StatItem>;
    distribution?: Record<string, StatItem>;
    discipline?: Record<string, StatItem>;
  };
}

export const getPlayerDetailedStats = async (
  playerId: number,
  seasonId?: number
): Promise<PlayerDetailedStatsResponse> => {
  const qs = new URLSearchParams({ player_id: String(playerId) });
  if (seasonId) qs.append('season_id', String(seasonId));
  return apiFetch(`/api/stats/player-detailed-stats?${qs}`);
};

Object.defineProperty(getPlayerDetailedStats, 'queryKey', { value: 'playerDetailedStats' });

// --- 현재 시즌 통계 ---

export interface PlayerCurrentSeasonStats {
  season_id: number;
  season_name: string;
  team: { team_id: number; team_name: string; logo: string | null } | null;
  is_goalkeeper: boolean;
  matches: number;
  starters: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  clean_sheets: number;
  goals_conceded: number;
  pk_saves: number;
  avg_rating: number | null;
  avg_xt_rating: number | null;
}

export const getPlayerCurrentSeason = async (
  playerId: number
): Promise<PlayerCurrentSeasonStats | null> => {
  try {
    const res = await apiFetch<{ data: PlayerCurrentSeasonStats | null }>(
      `/api/stats/player-current-season?player_id=${playerId}`
    );
    return res.data;
  } catch {
    return null;
  }
};

Object.defineProperty(getPlayerCurrentSeason, 'queryKey', { value: 'playerCurrentSeason' });

// --- 경기 로그 ---

export interface PlayerMatchLogEntry {
  match_id: number;
  date: string;
  season: string | null;
  opponent_name: string;
  opponent_logo: string | null;
  result: 'W' | 'D' | 'L';
  home_score: number | null;
  away_score: number | null;
  penalty_home_score: number | null;
  penalty_away_score: number | null;
  goals: number;
  assists: number;
  yellow_card: number;
  red_card: number;
  rating: number | null;
  xt_rating: number | null;
}

export interface PlayerMatchLogResponse {
  items: PlayerMatchLogEntry[];
  total: number;
  limit: number;
  nextCursor: string | null;
  hasNext: boolean;
}

export const getPlayerMatchLog = async (
  playerId: number,
  cursor?: string | null,
  limit: number = 10
): Promise<PlayerMatchLogResponse> => {
  const qs = new URLSearchParams({ player_id: String(playerId), limit: String(limit) });
  if (cursor) qs.append('cursor', cursor);
  return apiFetch(`/api/stats/player-match-log?${qs}`);
};

Object.defineProperty(getPlayerMatchLog, 'queryKey', { value: 'playerMatchLog' });

// --- 어시스트 로그 ---

export interface PlayerAssistLogEntry {
  match_id: number;
  date: string;
  season: string | null;
  opponent_name: string;
  opponent_logo: string | null;
  result: 'W' | 'D' | 'L';
  home_score: number | null;
  away_score: number | null;
  penalty_home_score: number | null;
  penalty_away_score: number | null;
  player_assists: number;
}

export const getPlayerAssistLog = async (playerId: number): Promise<PlayerAssistLogEntry[]> => {
  return apiFetch(`/api/stats/player-assist-log?player_id=${playerId}`);
};

Object.defineProperty(getPlayerAssistLog, 'queryKey', { value: 'playerAssistLog' });
