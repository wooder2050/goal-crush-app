import { apiFetch } from '@/api/client';
import type { UserProfile, UserProfileResponse } from '@/types/user';

export const getUserProfile = async (): Promise<UserProfileResponse> => {
  return apiFetch('/api/user/profile');
};

export const updateNickname = async (nickname: string): Promise<UserProfile> => {
  return apiFetch('/api/users/profile', {
    method: 'PUT',
    body: JSON.stringify({ korean_nickname: nickname }),
  });
};

export const checkNicknameAvailability = async (
  nickname: string
): Promise<{ available: boolean }> => {
  return apiFetch('/api/users/profile', {
    method: 'POST',
    body: JSON.stringify({ nickname }),
  });
};

export const getUserPoints = async (
  userId: string
): Promise<{
  totalPoints: number;
  history: Array<{
    id: number;
    points: number;
    reason: string;
    created_at: string;
  }>;
}> => {
  return apiFetch(`/api/user/points?userId=${userId}`);
};
