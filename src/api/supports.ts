import { apiFetch } from '@/api/client';

export interface MatchSupport {
  support_id: number;
  user_id: string;
  match_id: number;
  team_id: number;
  support_type?: string;
  message?: string;
  created_at: string;
  match?: {
    match_id: number;
    match_date: string;
    status: string;
    home_team: { team_id: number; team_name: string; logo: string | null };
    away_team: { team_id: number; team_name: string; logo: string | null };
    home_score: number | null;
    away_score: number | null;
  };
  team?: {
    team_id: number;
    team_name: string;
    logo: string | null;
  };
}

export interface UpcomingMatchForSupport {
  match_id: number;
  match_date: string;
  home_team: { team_id: number; team_name: string; logo: string | null };
  away_team: { team_id: number; team_name: string; logo: string | null };
  user_support?: {
    team_id: number;
    support_type?: string;
  } | null;
  support_counts?: {
    home: number;
    away: number;
  };
}

export const getUserSupports = async (): Promise<MatchSupport[]> => {
  return apiFetch('/api/supports');
};

export const getSupportForMatch = async (matchId: number): Promise<MatchSupport | null> => {
  try {
    return await apiFetch(`/api/supports?matchId=${matchId}`);
  } catch {
    return null;
  }
};

export const createSupport = async (data: {
  matchId: number;
  teamId: number;
  supportType?: string;
  message?: string;
}): Promise<MatchSupport> => {
  return apiFetch('/api/supports', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const cancelSupport = async (matchId: number): Promise<void> => {
  await apiFetch(`/api/supports?matchId=${matchId}`, { method: 'DELETE' });
};

export const getUpcomingMatchesForSupport = async (): Promise<UpcomingMatchForSupport[]> => {
  return apiFetch('/api/supports/upcoming');
};
