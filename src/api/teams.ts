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
  top_appearances: { player_id: number; name: string; appearances: number } | null;
  top_scorer: { player_id: number; name: string; goals: number } | null;
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
