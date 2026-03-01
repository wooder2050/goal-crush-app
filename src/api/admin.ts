import { apiFetch } from '@/api/client';

// --- Types ---

export interface AdminMatchItem {
  match_id: number;
  match_date: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  penalty_home_score: number | null;
  penalty_away_score: number | null;
  location: string | null;
  description: string | null;
  tournament_stage: string | null;
  group_stage: string | null;
  highlight_url: string | null;
  full_video_url: string | null;
  home_team: { team_id: number; team_name: string; logo: string | null };
  away_team: { team_id: number; team_name: string; logo: string | null };
  season?: { season_id: number; season_name: string } | null;
}

export interface CreateMatchData {
  season_id: number;
  home_team_id: number;
  away_team_id: number;
  match_date: string;
  location?: string | null;
  description?: string | null;
  tournament_stage?: string | null;
  group_stage?: string | null;
  status?: string;
}

export interface UpdateMatchData {
  home_score?: number;
  away_score?: number;
  penalty_home_score?: number | null;
  penalty_away_score?: number | null;
  status?: string;
  match_date?: string;
  location?: string | null;
  description?: string | null;
  tournament_stage?: string | null;
  group_stage?: string | null;
  highlight_url?: string | null;
  full_video_url?: string | null;
}

export interface AdminGoal {
  goal_id: number;
  match_id: number;
  player_id: number;
  goal_time: number;
  goal_type: string;
  description: string | null;
  player?: { player_id: number; name: string; jersey_number: number | null } | null;
  team?: { team_id: number; team_name: string } | null;
}

export interface AdminAssist {
  assist_id: number;
  goal_id: number;
  player_id: number;
  description: string | null;
  player: { player_id: number; name: string; jersey_number: number | null } | null;
  goal: {
    goal_id: number;
    goal_time: number;
    player: { player_id: number; name: string } | null;
  } | null;
}

export interface AdminLineup {
  stat_id: number;
  match_id: number;
  player_id: number;
  team_id: number;
  position: string;
  goals: number;
  assists: number;
  minutes_played: number;
  player: { player_id: number; name: string; jersey_number: number | null } | null;
  team: { team_id: number; team_name: string } | null;
}

export interface AdminSubstitution {
  substitution_id: number;
  match_id: number;
  team_id: number;
  player_in_id: number;
  player_out_id: number;
  substitution_time: number;
  substitution_reason: string | null;
  player_in: { player_id: number; name: string; jersey_number: number | null } | null;
  player_out: { player_id: number; name: string; jersey_number: number | null } | null;
  team: { team_id: number; team_name: string } | null;
}

export interface AdminPenalty {
  penalty_detail_id: number;
  match_id: number;
  team_id: number;
  kicker_id: number;
  goalkeeper_id: number;
  is_successful: boolean;
  kicker_order: number;
  kick_description: string | null;
  kicker: { player_id: number; name: string; jersey_number: number | null } | null;
  goalkeeper: { player_id: number; name: string; jersey_number: number | null } | null;
  team: { team_id: number; team_name: string } | null;
}

export interface AdminMatchCoach {
  id: string;
  team_id: number;
  coach_id: number;
  role: string;
  description: string | null;
  coach_name: string;
  team_name: string;
}

export interface AdminDetailedStats {
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
  player: { player_id: number; name: string; jersey_number: number | null } | null;
  team: { team_id: number; team_name: string } | null;
}

export interface CreateDetailedStatsData {
  player_id: number;
  team_id: number;
  passes?: number;
  passes_completed?: number;
  key_passes?: number;
  shots?: number;
  shots_on_target?: number;
  saves?: number;
  goals_conceded?: number;
  gk_throws?: number;
  gk_throws_completed?: number;
  tackles?: number;
  tackles_won?: number;
  interceptions?: number;
  clearances?: number;
  dribbles?: number;
  free_kicks?: number;
  free_kick_goals?: number;
  throw_ins?: number;
  corner_kicks?: number;
  penalty_goals?: number;
  goals?: number;
  assists?: number;
  yellow_cards?: number;
  red_cards?: number;
  fouls?: number;
  possession_time?: number;
}

export interface AdminTeamPlayer {
  player_id: number;
  name: string;
  jersey_number: number | null;
  position: string;
}

export interface ValidationDiscrepancy {
  type: string;
  message: string;
  details?: unknown;
}

// --- Match CRUD ---

export const getAdminMatches = async (params?: {
  status?: string;
  season_id?: number;
  team_id?: number;
  limit?: number;
}): Promise<AdminMatchItem[]> => {
  const qs = new URLSearchParams();
  if (params?.status) qs.append('status', params.status);
  if (params?.season_id) qs.append('season_id', String(params.season_id));
  if (params?.team_id) qs.append('team_id', String(params.team_id));
  if (params?.limit) qs.append('limit', String(params.limit));
  const q = qs.toString();
  return apiFetch(`/api/admin/matches${q ? `?${q}` : ''}`);
};

export const getAdminMatch = async (matchId: number): Promise<AdminMatchItem> => {
  return apiFetch(`/api/admin/matches/${matchId}`);
};

export const createAdminMatch = async (data: CreateMatchData): Promise<AdminMatchItem> => {
  return apiFetch('/api/admin/matches', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateAdminMatch = async (
  matchId: number,
  data: UpdateMatchData
): Promise<AdminMatchItem> => {
  return apiFetch(`/api/admin/matches/${matchId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

export const deleteAdminMatch = async (matchId: number): Promise<void> => {
  await apiFetch(`/api/admin/matches/${matchId}`, { method: 'DELETE' });
};

// --- Goals ---

export const getAdminGoals = async (matchId: number): Promise<AdminGoal[]> => {
  return apiFetch(`/api/admin/matches/${matchId}/goals`);
};

export const createAdminGoal = async (
  matchId: number,
  data: { player_id: number; goal_time: number; goal_type?: string; description?: string | null }
): Promise<AdminGoal> => {
  return apiFetch(`/api/admin/matches/${matchId}/goals`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// --- Assists ---

export const getAdminAssists = async (matchId: number): Promise<AdminAssist[]> => {
  return apiFetch(`/api/admin/matches/${matchId}/assists`);
};

export const createAdminAssist = async (
  matchId: number,
  data: { player_id: number; goal_id: number }
): Promise<AdminAssist> => {
  return apiFetch(`/api/admin/matches/${matchId}/assists`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// --- Lineups ---

export const getAdminLineups = async (matchId: number): Promise<AdminLineup[]> => {
  return apiFetch(`/api/admin/matches/${matchId}/lineups`);
};

export const createAdminLineup = async (
  matchId: number,
  data: {
    player_id: number;
    team_id: number;
    position: string;
    minutes_played?: number;
    goals_conceded?: number | null;
  }
): Promise<AdminLineup> => {
  return apiFetch(`/api/admin/matches/${matchId}/lineups`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// --- Substitutions ---

export const getAdminSubstitutions = async (matchId: number): Promise<AdminSubstitution[]> => {
  return apiFetch(`/api/admin/matches/${matchId}/substitutions`);
};

export const createAdminSubstitution = async (
  matchId: number,
  data: {
    team_id: number;
    player_in_id: number;
    player_out_id: number;
    substitution_time: number;
    description?: string | null;
  }
): Promise<AdminSubstitution> => {
  return apiFetch(`/api/admin/matches/${matchId}/substitutions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const deleteAdminSubstitution = async (
  matchId: number,
  substitutionId: number
): Promise<void> => {
  await apiFetch(`/api/admin/matches/${matchId}/substitutions/${substitutionId}`, {
    method: 'DELETE',
  });
};

// --- Penalties ---

export const getAdminPenalties = async (matchId: number): Promise<AdminPenalty[]> => {
  return apiFetch(`/api/admin/matches/${matchId}/penalties`);
};

export const createAdminPenalty = async (
  matchId: number,
  data: {
    team_id: number;
    player_id: number;
    goalkeeper_id: number;
    is_scored: boolean;
    order: number;
  }
): Promise<AdminPenalty> => {
  return apiFetch(`/api/admin/matches/${matchId}/penalties`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// --- Match Coaches ---

export const getAdminMatchCoaches = async (matchId: number): Promise<AdminMatchCoach[]> => {
  return apiFetch(`/api/admin/matches/${matchId}/coaches`);
};

export const createAdminMatchCoach = async (
  matchId: number,
  data: { team_id: number; coach_id: number; role: string }
): Promise<AdminMatchCoach> => {
  return apiFetch(`/api/admin/matches/${matchId}/coaches`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const deleteAdminMatchCoach = async (matchId: number, coachId: number): Promise<void> => {
  await apiFetch(`/api/admin/matches/${matchId}/coaches/${coachId}`, {
    method: 'DELETE',
  });
};

// --- Detailed Stats ---

export const getAdminDetailedStats = async (matchId: number): Promise<AdminDetailedStats[]> => {
  return apiFetch(`/api/admin/matches/${matchId}/detailed-stats`);
};

export const saveAdminDetailedStats = async (
  matchId: number,
  data: CreateDetailedStatsData
): Promise<AdminDetailedStats> => {
  return apiFetch(`/api/admin/matches/${matchId}/detailed-stats`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const bulkSaveAdminDetailedStats = async (
  matchId: number,
  stats: CreateDetailedStatsData[]
): Promise<{ success: boolean; count: number }> => {
  return apiFetch(`/api/admin/matches/${matchId}/detailed-stats/bulk`, {
    method: 'POST',
    body: JSON.stringify({ stats }),
  });
};

export const deleteAdminDetailedStats = async (
  matchId: number,
  playerId: number
): Promise<void> => {
  await apiFetch(`/api/admin/matches/${matchId}/detailed-stats?player_id=${playerId}`, {
    method: 'DELETE',
  });
};

// --- Match Ratings ---

export const calculateAdminMatchRatings = async (
  matchId: number
): Promise<Array<{ player_id: number; rating: number }>> => {
  return apiFetch(`/api/admin/matches/${matchId}/ratings`, { method: 'POST' });
};

export const deleteAdminMatchRatings = async (matchId: number): Promise<void> => {
  await apiFetch(`/api/admin/matches/${matchId}/ratings`, { method: 'DELETE' });
};

// --- Team Players ---

export const getAdminTeamPlayers = async (teamId: number): Promise<AdminTeamPlayer[]> => {
  return apiFetch(`/api/teams/${teamId}/players?scope=current`);
};

// --- Team CRUD ---

export const createAdminTeam = async (data: {
  team_name: string;
  founded_year?: number;
  description?: string;
  primary_color?: string;
  secondary_color?: string;
  logo?: string;
}): Promise<{ team_id: number; team_name: string }> => {
  return apiFetch('/api/admin/teams', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateAdminTeam = async (
  teamId: number,
  data: {
    team_name?: string;
    founded_year?: number;
    description?: string;
    primary_color?: string;
    secondary_color?: string;
    logo?: string;
  }
): Promise<{ team_id: number; team_name: string }> => {
  return apiFetch(`/api/admin/teams/${teamId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteAdminTeam = async (teamId: number): Promise<void> => {
  await apiFetch(`/api/admin/teams/${teamId}`, { method: 'DELETE' });
};

// --- Coach CRUD ---

export const createAdminCoach = async (data: {
  name: string;
  birth_date?: string;
  nationality?: string;
  profile_image_url?: string;
}): Promise<{ coach_id: number; name: string }> => {
  return apiFetch('/api/admin/coaches', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateAdminCoach = async (
  coachId: number,
  data: {
    name?: string;
    birth_date?: string;
    nationality?: string;
    profile_image_url?: string;
  }
): Promise<{ coach_id: number; name: string }> => {
  return apiFetch(`/api/admin/coaches/${coachId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteAdminCoach = async (coachId: number): Promise<void> => {
  await apiFetch(`/api/admin/coaches/${coachId}`, { method: 'DELETE' });
};

// --- Stats Management ---

export const validateAdminStats = async (seasonId?: number): Promise<ValidationDiscrepancy[]> => {
  const qs = seasonId ? `?season_id=${seasonId}` : '';
  return apiFetch(`/api/admin/stats/validate${qs}`);
};

export const regenerateAdminStats = async (
  type: 'all' | 'standings' | 'player_stats' | 'team_stats' | 'h2h' | 'team_seasons' = 'all',
  seasonId?: number
): Promise<{ success: boolean; message: string }> => {
  const body: Record<string, unknown> = { type };
  if (seasonId) body.season_id = seasonId;
  return apiFetch('/api/admin/stats/regenerate', {
    method: 'POST',
    body: JSON.stringify(body),
  });
};
