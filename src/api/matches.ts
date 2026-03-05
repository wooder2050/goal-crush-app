import { apiFetch } from '@/api/client';
import {
  Assist,
  Goal,
  MatchWithTeams,
  PenaltyShootoutDetailWithPlayers,
  Substitution,
  SubstitutionInput,
} from '@/lib/types';

interface GoalWithTeam extends Goal {
  team: { team_id: number; team_name: string };
  player: { name: string };
}

export interface LineupPlayer {
  stat_id: number;
  match_id: number;
  player_id: number;
  team_id: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  minutes_played: number;
  saves: number;
  position: string;
  player_name: string;
  jersey_number: number | null;
  profile_image_url: string | null;
  team_name: string;
  participation_status: 'starting' | 'substitute' | 'bench';
  card_type: 'none' | 'yellow' | 'red_direct' | 'red_accumulated';
}

interface SeasonSummary {
  season_id: number;
  season_name: string;
  year: number;
  total_matches: number;
  participating_teams: number;
  completed_matches: number;
  penalty_matches: number;
  completion_rate: number;
}

export interface MatchDetailedStats {
  detailed_stat_id: number;
  match_id: number;
  player_id: number;
  team_id: number;
  passes: number;
  passes_completed: number;
  pass_accuracy: number | null;
  key_passes: number;
  shots: number;
  shots_on_target: number;
  shot_accuracy: number | null;
  saves: number;
  goals_conceded: number;
  gk_throws: number;
  gk_throws_completed: number;
  tackles: number;
  tackles_won: number;
  interceptions: number;
  clearances: number;
  dribbles: number;
  free_kicks: number;
  free_kick_goals: number;
  throw_ins: number;
  corner_kicks: number;
  penalty_goals: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  fouls: number;
  possession_time: number;
  player: {
    player_id: number;
    name: string;
    jersey_number: number | null;
    profile_image_url: string | null;
  };
  team: { team_id: number; team_name: string };
}

export interface PlayerPosition {
  player_id: number;
  player_name: string;
  jersey_number: number;
  profile_image_url?: string | null;
  avg_x: number;
  avg_y: number;
  total_passes: number;
  success_passes: number;
}

export interface PassConnection {
  from_jersey: number;
  to_jersey: number;
  count: number;
}

export interface TeamPassNetworkData {
  team_id: number;
  team_name: string;
  primary_color: string;
  secondary_color: string;
  players: PlayerPosition[];
  connections: PassConnection[];
  total_passes: number;
  success_passes: number;
}

export interface PlayerMatchRating {
  player_id: number;
  team_id: number;
  player_name: string;
  jersey_number: number | null;
  profile_image_url: string | null;
  team_name: string;
  position: string;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  rating: number;
  breakdown: Record<string, number>;
}

export interface MatchRatingsResponse {
  match_id: number;
  ratings: PlayerMatchRating[];
}

export const getMatchesPrisma = async (): Promise<MatchWithTeams[]> => {
  return apiFetch<MatchWithTeams[]>('/api/matches');
};

export const getMatchByIdPrisma = async (matchId: number): Promise<MatchWithTeams | null> => {
  try {
    return await apiFetch<MatchWithTeams>(`/api/matches/${matchId}`);
  } catch {
    return null;
  }
};

getMatchByIdPrisma.queryKey = 'match-by-id';

export const getHeadToHeadByMatchIdPrisma = async (
  matchId: number
): Promise<{
  match_id: number;
  teamA: { team_id: number; team_name: string; logo: string | null } | null;
  teamB: { team_id: number; team_name: string; logo: string | null } | null;
  summary: {
    total: number;
    teamA: {
      wins: number;
      draws: number;
      losses: number;
      goals_for: number;
      goals_against: number;
    };
    teamB: {
      wins: number;
      draws: number;
      losses: number;
      goals_for: number;
      goals_against: number;
    };
  };
}> => {
  return apiFetch(`/api/matches/${matchId}/head-to-head`);
};

export const getHeadToHeadListByMatchIdPrisma = async (
  matchId: number,
  scope: 'prev' | 'next' = 'prev'
): Promise<{
  total: number;
  items: Array<{
    match_id: number;
    match_date: string;
    season: { season_id: number; season_name: string; category: string | null } | null;
    tournament_stage: string | null;
    group_stage: string | null;
    home: {
      team_id: number;
      team_name: string;
      logo: string | null;
      primary_color: string | null;
      secondary_color: string | null;
    } | null;
    away: {
      team_id: number;
      team_name: string;
      logo: string | null;
      primary_color: string | null;
      secondary_color: string | null;
    } | null;
    score: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null } | null;
  }>;
}> => {
  return apiFetch(`/api/matches/${matchId}/head-to-head/list?scope=${scope}`);
};

export const getMatchesBySeasonIdPrisma = async (seasonId: number): Promise<MatchWithTeams[]> => {
  return apiFetch<MatchWithTeams[]>(`/api/matches/season/${seasonId}`);
};

export const getSeasonMatchesPagePrisma = async (
  seasonId: number,
  page: number,
  limit: number = 6,
  tournamentStage?: string,
  groupStage?: string
): Promise<{
  items: MatchWithTeams[];
  totalCount: number;
  nextPage: number | null;
  hasNextPage: boolean;
  currentPage: number;
  tournamentStats: { group_stage: number; championship: number; relegation: number };
  totalMatchesCount: number;
}> => {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  if (tournamentStage && tournamentStage !== 'all')
    params.append('tournament_stage', tournamentStage);
  if (groupStage && groupStage !== 'all') params.append('group_stage', groupStage);
  return apiFetch(`/api/matches/season/${seasonId}?${params.toString()}`);
};

export const getMatchGoalsPrisma = async (matchId: number): Promise<GoalWithTeam[]> => {
  return apiFetch(`/api/matches/${matchId}/goals`);
};

export const getMatchGoalsWithAssistsPrisma = async (matchId: number): Promise<GoalWithTeam[]> => {
  return apiFetch(`/api/matches/${matchId}/goals`);
};

export const getMatchAssistsPrisma = async (matchId: number): Promise<Assist[]> => {
  return apiFetch(`/api/matches/${matchId}/assists`);
};

export const getKeyPlayersByMatchIdPrisma = async (
  matchId: number
): Promise<{
  match_id: number;
  home: Array<{
    player_id: number;
    team_id: number;
    player_name: string;
    jersey_number: number | null;
    position: string | null;
    goals: number;
    assists: number;
    minutes: number;
    profile_image_url: string | null;
  }>;
  away: Array<{
    player_id: number;
    team_id: number;
    player_name: string;
    jersey_number: number | null;
    position: string | null;
    goals: number;
    assists: number;
    minutes: number;
    profile_image_url: string | null;
  }>;
}> => {
  return apiFetch(`/api/matches/${matchId}/key-players`);
};

export const createAssistPrisma = async (
  matchId: number,
  assist: {
    player_id: number;
    goal_id: number;
    assist_time?: number;
    assist_type?: string;
    description?: string;
  }
): Promise<Assist> => {
  return apiFetch(`/api/matches/${matchId}/assists`, {
    method: 'POST',
    body: JSON.stringify(assist),
  });
};

export const getMatchLineupsPrisma = async (
  matchId: number
): Promise<Record<string, LineupPlayer[]>> => {
  return apiFetch(`/api/matches/${matchId}/lineups`);
};

export const getPredictedMatchLineupsPrisma = async (
  matchId: number
): Promise<Record<string, LineupPlayer[]>> => {
  return apiFetch(`/api/matches/${matchId}/predicted-lineups`);
};

export const getPenaltyShootoutDetailsPrisma = async (
  matchId: number
): Promise<PenaltyShootoutDetailWithPlayers[]> => {
  return apiFetch(`/api/matches/${matchId}/penalties`);
};

type UpcomingMatchesResponse = {
  total: number;
  matches: Array<{
    match_id: number;
    match_date: string;
    description: string | null;
    season: { season_id: number; season_name: string } | null;
    home: { team_id: number; team_name: string; logo: string | null } | null;
    away: { team_id: number; team_name: string; logo: string | null } | null;
  }>;
};

export const getUpcomingMatchesPrisma = async (filters?: {
  teamId?: number;
  seasonId?: number;
  limit?: number;
  offset?: number;
}): Promise<UpcomingMatchesResponse> => {
  const q = new URLSearchParams();
  if (filters?.teamId) q.set('teamId', String(filters.teamId));
  if (filters?.seasonId) q.set('seasonId', String(filters.seasonId));
  if (filters?.limit) q.set('limit', String(filters.limit));
  if (filters?.offset) q.set('offset', String(filters.offset));
  const qs = q.toString();
  return apiFetch(`/api/matches/upcoming${qs ? `?${qs}` : ''}`);
};

export const getUpcomingMatchesPagePrisma = async (
  page: number,
  limit: number = 6,
  filters?: { teamId?: number; seasonId?: number }
): Promise<{
  matches: Array<{
    match_id: number;
    match_date: string;
    description: string | null;
    season: { season_id: number; season_name: string } | null;
    home: { team_id: number; team_name: string; logo: string | null } | null;
    away: { team_id: number; team_name: string; logo: string | null } | null;
  }>;
  totalCount: number;
  nextPage: number | null;
  hasNextPage: boolean;
  currentPage: number;
}> => {
  const offset = (page - 1) * limit;
  const q = new URLSearchParams();
  q.set('limit', String(limit));
  q.set('offset', String(offset));
  if (filters?.teamId) q.set('teamId', String(filters.teamId));
  if (filters?.seasonId) q.set('seasonId', String(filters.seasonId));
  return apiFetch(`/api/matches/upcoming?${q.toString()}`);
};

export const getCoachHeadToHeadListByMatchIdPrisma = async (
  matchId: number,
  scope: 'prev' | 'next' = 'prev'
): Promise<{
  total: number;
  items: Array<{
    match_id: number;
    match_date: string;
    season: { season_id: number; season_name: string; category: string | null } | null;
    home: {
      team_id: number | null;
      team_name: string | null;
      primary_color: string | null;
      secondary_color: string | null;
      coach_id: number | null;
      coach_name: string | null;
      coach_image: string | null;
    };
    away: {
      team_id: number | null;
      team_name: string | null;
      primary_color: string | null;
      secondary_color: string | null;
      coach_id: number | null;
      coach_name: string | null;
      coach_image: string | null;
    };
    score: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null } | null;
    group_stage: boolean | null;
    tournament_stage: string | null;
  }>;
  current: {
    home_coach_id: number | null;
    away_coach_id: number | null;
    home_coach_name: string | null;
    away_coach_name: string | null;
    home_coach_image: string | null;
    away_coach_image: string | null;
  };
}> => {
  return apiFetch(`/api/matches/${matchId}/head-to-head/coaches/list?scope=${scope}`);
};

export const createSubstitutionPrisma = async (
  matchId: number,
  substitution: SubstitutionInput
): Promise<Substitution> => {
  return apiFetch(`/api/matches/${matchId}/substitutions`, {
    method: 'POST',
    body: JSON.stringify(substitution),
  });
};

export const getSubstitutionsPrisma = async (matchId: number): Promise<Substitution[]> => {
  return apiFetch(`/api/matches/${matchId}/substitutions`);
};

export const getSeasonSummariesPrisma = async (): Promise<SeasonSummary[]> => {
  return apiFetch('/api/seasons/summary');
};

export const getSeasonSummaryBySeasonIdPrisma = async (
  seasonId: number
): Promise<SeasonSummary[]> => {
  return apiFetch(`/api/seasons/${seasonId}/summary`);
};

Object.defineProperty(getSeasonSummaryBySeasonIdPrisma, 'queryKey', {
  value: 'seasonSummaryBySeasonId',
});

export const getTeamRecentFormPrisma = async (
  teamId: number,
  beforeDate: string
): Promise<
  Array<{
    match_id: number;
    match_date: string;
    home_team_id: number;
    away_team_id: number;
    home_score: number | null;
    away_score: number | null;
    penalty_home_score: number | null;
    penalty_away_score: number | null;
    home_team: { team_id: number; team_name: string };
    away_team: { team_id: number; team_name: string };
  }>
> => {
  return apiFetch(`/api/teams/${teamId}/recent-form?before=${beforeDate}`);
};

export const getSeasonPlayersPrisma = async (
  seasonId: number,
  teamId: number
): Promise<
  Array<{
    player_id: number;
    player_name: string;
    jersey_number: number | null;
    position: string;
  }>
> => {
  return apiFetch(`/api/seasons/${seasonId}/teams/${teamId}/players`);
};

export const getLastMatchLineupsPrisma = async (
  teamId: number,
  beforeDate: string
): Promise<
  Array<{
    player_id: number;
    player_name: string;
    jersey_number: number | null;
    position: string;
    participation_status: string;
  }>
> => {
  return apiFetch(`/api/teams/${teamId}/last-match-lineups?before=${beforeDate}`);
};

export const getMatchDetailedStatsPrisma = async (
  matchId: number
): Promise<MatchDetailedStats[]> => {
  return apiFetch(`/api/matches/${matchId}/detailed-stats`);
};

export const getMatchPassMapPrisma = async (matchId: number): Promise<TeamPassNetworkData[]> => {
  try {
    return await apiFetch(`/api/admin/matches/${matchId}/actions/pass-map`);
  } catch {
    return [];
  }
};

export interface RawMatchAction {
  action_id: number;
  team_id: number;
  period_id: number;
  action_type: string;
  start_x: number;
  start_y: number;
  player?: { name: string; jersey_number: number | null };
}

export const getMatchActionsPrisma = async (matchId: number): Promise<RawMatchAction[]> => {
  try {
    return await apiFetch(`/api/admin/matches/${matchId}/actions`);
  } catch {
    return [];
  }
};

export const getMatchRatingsPrisma = async (matchId: number): Promise<MatchRatingsResponse> => {
  try {
    return await apiFetch(`/api/matches/${matchId}/ratings`);
  } catch {
    return { match_id: matchId, ratings: [] };
  }
};

export interface PlayerMatchXtRating {
  player_id: number;
  team_id: number;
  player_name: string;
  jersey_number: number | null;
  profile_image_url: string | null;
  team_name: string;
  position: string;
  xt_rating: number;
  total_xt: number;
  offensive_xt: number;
  defensive_xt: number;
  actions_count: number;
  breakdown: Record<string, { count: number; total_xt: number; avg_xt: number }>;
}

export interface MatchXtRatingsResponse {
  match_id: number;
  ratings: PlayerMatchXtRating[];
}

export const getMatchXtRatingsPrisma = async (matchId: number): Promise<MatchXtRatingsResponse> => {
  try {
    return await apiFetch(`/api/matches/${matchId}/xt-ratings`);
  } catch {
    return { match_id: matchId, ratings: [] };
  }
};
