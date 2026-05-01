import { apiFetch } from '@/api/client';
import type { TeamWithExtras } from '@/features/teams/types';
import { Player, PlayerTeamHistory, Team } from '@/lib/types';

export type PlayerWithTeamHistory = Player & {
  player_team_history: PlayerTeamHistory[];
};

export type TeamStats = {
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
  win_rate: number;
};

export type TeamSeasonStandingRow = {
  year: number;
  season_id: number | null;
  season_name: string | null;
  category?: string | null;
  league: 'super' | 'challenge' | 'playoff' | 'cup' | 'g-league' | 'other';
  participated: boolean;
  position: number | null;
  matches_played: number;
  points: number;
  isSeasonEnded?: boolean;
};

export const getTeamsPrisma = async (): Promise<TeamWithExtras[]> => {
  const result = await apiFetch<{ data: TeamWithExtras[] }>('/api/teams');
  return result.data || [];
};

Object.defineProperty(getTeamsPrisma, 'queryKey', { value: 'teamsAll' });

export const getTeamByIdPrisma = async (teamId: number): Promise<Team> => {
  return apiFetch<Team>(`/api/teams/${teamId}`);
};

Object.defineProperty(getTeamByIdPrisma, 'queryKey', { value: 'teamById' });

export const getTeamsBySeasonPrisma = async (seasonId: number): Promise<Team[]> => {
  return apiFetch<Team[]>(`/api/teams?season_id=${seasonId}`);
};

Object.defineProperty(getTeamsBySeasonPrisma, 'queryKey', { value: 'teamsBySeason' });

export const getTeamPlayersPrisma = async (
  teamId: number,
  scope: 'current' | 'all' = 'all'
): Promise<PlayerWithTeamHistory[]> => {
  return apiFetch<PlayerWithTeamHistory[]>(
    `/api/teams/${teamId}/players?scope=${scope}&order=stats`
  );
};

Object.defineProperty(getTeamPlayersPrisma, 'queryKey', { value: 'teamPlayers' });

export const getTeamStatsPrisma = async (teamId: number, seasonId?: number): Promise<TeamStats> => {
  const qs = seasonId ? `?season_id=${seasonId}` : '';
  return apiFetch<TeamStats>(`/api/teams/${teamId}/stats${qs}`);
};

Object.defineProperty(getTeamStatsPrisma, 'queryKey', { value: 'teamStats' });

export const getTeamSeasonStandingsPrisma = async (
  teamId: number
): Promise<TeamSeasonStandingRow[]> => {
  return apiFetch<TeamSeasonStandingRow[]>(`/api/teams/${teamId}/season-standings`);
};

Object.defineProperty(getTeamSeasonStandingsPrisma, 'queryKey', {
  value: 'teamSeasonStandings',
});

export const getTeamHighlightsPrisma = async (
  teamId: number
): Promise<{
  top_appearances: { player_id: number; name: string; appearances: number; profile_image_url?: string | null } | null;
  top_scorer: { player_id: number; name: string; goals: number; profile_image_url?: string | null } | null;
  championships: {
    count: number;
    seasons: Array<{ season_id: number; season_name: string | null; year: number | null }>;
  };
  best_positions: {
    super: number | null;
    challenge: number | null;
    cup: number | null;
    'g-league': number | null;
  };
  best_overall: {
    position: number | null;
    league: 'super' | 'cup' | 'challenge' | 'g-league' | null;
  };
  best_position: number | null;
}> => {
  return apiFetch(`/api/teams/${teamId}/highlights`);
};

Object.defineProperty(getTeamHighlightsPrisma, 'queryKey', { value: 'teamHighlights' });

// --- 포메이션 ---

export interface TeamFormationPosition {
  position: string;
  player_id: number;
  name: string;
  count: number;
  jersey_number: number | null;
  profile_image_url: string | null;
  total_players: number;
}

export interface TeamFormation {
  positions: TeamFormationPosition[];
  season_name: string | null;
}

export const getTeamFormationPrisma = async (teamId: number): Promise<TeamFormation> => {
  return apiFetch(`/api/teams/${teamId}/formation`);
};

Object.defineProperty(getTeamFormationPrisma, 'queryKey', { value: 'teamFormation' });

// --- 최근 경기 폼 ---

export interface TeamRecentMatch {
  match_id: number;
  match_date: string;
  season_name: string;
  opponent_name: string;
  opponent_logo: string | null;
  is_home: boolean;
  home_score: number | null;
  away_score: number | null;
  penalty_home_score: number | null;
  penalty_away_score: number | null;
  result: 'W' | 'L' | 'D';
}

export const getTeamRecentFormPrisma = async (
  teamId: number,
  limit: number = 10
): Promise<TeamRecentMatch[]> => {
  return apiFetch(`/api/teams/${teamId}/recent-form?limit=${limit}`);
};

Object.defineProperty(getTeamRecentFormPrisma, 'queryKey', { value: 'teamRecentForm' });

// --- TOP 선수 ---

export interface TeamPlayerStatRow {
  player_id: number;
  name: string;
  profile_image_url: string | null;
  team_name: string | null;
  team_logo: string | null;
  value: number;
}

export interface TeamTopPlayersData {
  topScorers: TeamPlayerStatRow[];
  topAssists: TeamPlayerStatRow[];
  topRated: TeamPlayerStatRow[];
}

export const getTeamTopPlayersPrisma = async (teamId: number): Promise<TeamTopPlayersData> => {
  return apiFetch(`/api/teams/${teamId}/top-players`);
};

Object.defineProperty(getTeamTopPlayersPrisma, 'queryKey', { value: 'teamTopPlayers' });

// --- 감독 시즌 기록 ---

export interface CoachSeasonRecord {
  season_name: string;
  coach_id: number;
  coach_name: string;
  profile_image_url: string | null;
  matches: number;
  wins: number;
  losses: number;
  win_rate: number;
  ppg: number;
}

export const getTeamCoachRecordsPrisma = async (teamId: number): Promise<CoachSeasonRecord[]> => {
  return apiFetch(`/api/teams/${teamId}/coach-records`);
};

Object.defineProperty(getTeamCoachRecordsPrisma, 'queryKey', { value: 'teamCoachRecords' });
