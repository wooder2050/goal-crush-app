import { apiFetch } from '@/api/client';
import type { HomePageData } from '@/features/home/types';

export const fetchHomePageData = async (): Promise<HomePageData> => {
  return apiFetch<HomePageData>('/api/home/data');
};

fetchHomePageData.queryKey = 'homePageData';
