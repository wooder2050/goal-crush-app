import { apiFetch } from '@/api/client';
import { Season } from '@/lib/types';

export interface SeasonWithStats extends Season {
  status?: 'upcoming' | 'ongoing' | 'completed';
  match_count?: number;
  champion_team_id?: number | null;
  champion_team_name?: string | null;
  champion_team_logo?: string | null;
  champion_label?: '우승팀' | '승격팀' | '1위' | '현재 1위' | null;
  champion_teams?: Array<{
    team_id: number | null;
    team_name: string | null;
    logo: string | null;
  }>;
}

export const getAllSeasonsPrisma = async (): Promise<SeasonWithStats[]> => {
  return apiFetch<SeasonWithStats[]>('/api/seasons');
};

Object.defineProperty(getAllSeasonsPrisma, 'queryKey', { value: 'allSeasons' });

export const getSeasonsPaginatedPrisma = async ({
  page = 1,
  limit = 10,
}: {
  page?: number;
  limit?: number;
} = {}): Promise<{
  items: SeasonWithStats[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}> => {
  return apiFetch(`/api/seasons?page=${page}&limit=${limit}`);
};

Object.defineProperty(getSeasonsPaginatedPrisma, 'queryKey', { value: 'seasonsPaginated' });

export const getSeasonsPagePrisma = async (
  page: number,
  limit: number = 6
): Promise<{
  items: SeasonWithStats[];
  totalCount: number;
  nextPage: number | null;
  hasNextPage: boolean;
  currentPage: number;
}> => {
  return apiFetch(`/api/seasons?page=${page}&limit=${limit}`);
};

export const getSeasonByIdPrisma = async (seasonId: number): Promise<Season | null> => {
  try {
    return await apiFetch<Season>(`/api/seasons/${seasonId}`);
  } catch {
    return null;
  }
};

Object.defineProperty(getSeasonByIdPrisma, 'queryKey', { value: 'seasonById' });

export const getSeasonsByYearPrisma = async (year: number): Promise<Season[]> => {
  return apiFetch<Season[]>(`/api/seasons?year=${year}`);
};

Object.defineProperty(getSeasonsByYearPrisma, 'queryKey', { value: 'seasonsByYear' });

export const getLatestSeasonPrisma = async (): Promise<Season | null> => {
  try {
    return await apiFetch<Season>('/api/seasons/latest');
  } catch {
    return null;
  }
};

Object.defineProperty(getLatestSeasonPrisma, 'queryKey', { value: 'latestSeason' });

export const searchSeasonsByNamePrisma = async (name: string): Promise<Season[]> => {
  return apiFetch<Season[]>(`/api/seasons?name=${encodeURIComponent(name)}`);
};

Object.defineProperty(searchSeasonsByNamePrisma, 'queryKey', { value: 'seasonsByName' });

export const getSeasonByNamePrisma = async (seasonName: string): Promise<Season | null> => {
  const seasons = await apiFetch<Season[]>(`/api/seasons?name=${encodeURIComponent(seasonName)}`);
  return seasons.length > 0 ? seasons[0] : null;
};

export const createSeasonPrisma = async (seasonData: {
  season_name: string;
  year: number;
  start_date?: string;
  end_date?: string;
}): Promise<Season> => {
  return apiFetch<Season>('/api/seasons', {
    method: 'POST',
    body: JSON.stringify(seasonData),
  });
};

export const updateSeasonPrisma = async (
  seasonId: number,
  seasonData: {
    season_name: string;
    year: number;
    start_date?: string;
    end_date?: string;
  }
): Promise<Season> => {
  return apiFetch<Season>(`/api/seasons/${seasonId}`, {
    method: 'PUT',
    body: JSON.stringify(seasonData),
  });
};

export const deleteSeasonPrisma = async (seasonId: number): Promise<void> => {
  await apiFetch(`/api/seasons?id=${seasonId}`, { method: 'DELETE' });
};
