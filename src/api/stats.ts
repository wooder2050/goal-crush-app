import { apiFetch } from '@/api/client';
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
