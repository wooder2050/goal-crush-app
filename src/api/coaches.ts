import { apiFetch } from '@/api/client';
import type {
  CoachDetail,
  CoachFull,
  CoachOverview,
  CoachSeasonStats,
  CoachTrophies,
  CoachWithHistory,
  TeamCurrentHeadCoach,
} from '@/lib/types/database';

export type CoachesPageItem = CoachWithHistory & {
  current_team_verified: {
    team_id: number;
    team_name: string;
    logo: string | null;
    last_match_date: string;
  } | null;
  has_current_team: boolean;
  total_matches: number;
};

export async function fetchCoaches(): Promise<{
  coaches: CoachWithHistory[];
  total: number;
}> {
  return apiFetch('/api/coaches');
}

export async function fetchCoachDetail(coachId: number): Promise<CoachDetail | null> {
  return apiFetch(`/api/coaches/${coachId}`);
}

export async function fetchCoachStats(
  coachId: number
): Promise<{ season_stats: CoachSeasonStats[] }> {
  return apiFetch(`/api/coaches/${coachId}/stats`);
}

export async function fetchCoachCurrentTeam(coachId: number): Promise<TeamCurrentHeadCoach | null> {
  try {
    return await apiFetch(`/api/coaches/${coachId}/current-team`);
  } catch {
    return null;
  }
}

export async function fetchCoachTrophies(coachId: number): Promise<CoachTrophies> {
  return apiFetch(`/api/coaches/${coachId}/trophies`);
}

export async function fetchCoachOverview(coachId: number): Promise<CoachOverview> {
  return apiFetch(`/api/coaches/${coachId}/overview`);
}

export async function fetchCoachFull(coachId: number): Promise<CoachFull> {
  return apiFetch(`/api/coaches/${coachId}/full`);
}

export async function getCoachesPagePrisma(
  page: number,
  pageSize = 6,
  opts?: { order?: 'total' | 'wins' | 'win_rate' }
): Promise<{
  items: CoachesPageItem[];
  nextPage: number | null;
  totalCount: number;
}> {
  const offset = (page - 1) * pageSize;
  const params = new URLSearchParams({
    limit: String(pageSize),
    offset: String(offset),
  });
  if (opts?.order) params.set('order', opts.order);
  const data = await apiFetch<{ coaches: CoachesPageItem[]; total: number }>(
    `/api/coaches?${params.toString()}`
  );
  const nextPage = offset + data.coaches.length < data.total ? page + 1 : null;
  return { items: data.coaches, nextPage, totalCount: data.total };
}
