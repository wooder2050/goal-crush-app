import { apiFetch } from '@/api/client';
import type {
  CommunityPost,
  CommunityStats,
  HotTopic,
  MVPVoteResult,
  MVPVotingData,
  TeamCommunity,
} from '@/types/community';

// --- Posts ---

export interface PostsPageResponse {
  posts: CommunityPost[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export interface PostDetail extends CommunityPost {
  category?: string;
  views_count?: number;
  comments?: PostComment[];
  is_liked?: boolean;
}

export interface PostComment {
  id: string;
  content: string;
  user_nickname: string;
  user_avatar?: string | null;
  created_at: string;
}

export const getCommunityPosts = async (params: {
  page?: number;
  limit?: number;
  category?: string;
  team_id?: number;
  sortBy?: 'recent' | 'popular';
}): Promise<PostsPageResponse> => {
  const qs = new URLSearchParams();
  if (params.page) qs.append('page', String(params.page));
  if (params.limit) qs.append('limit', String(params.limit));
  if (params.category) qs.append('category', params.category);
  if (params.team_id) qs.append('team_id', String(params.team_id));
  if (params.sortBy) qs.append('sortBy', params.sortBy);
  return apiFetch(`/api/community/posts?${qs}`);
};

export const getPostById = async (postId: string): Promise<PostDetail> => {
  return apiFetch(`/api/community/posts/${postId}`);
};

export const createPost = async (data: {
  title: string;
  content: string;
  category: string;
  team_id?: number;
}): Promise<CommunityPost> => {
  return apiFetch('/api/community/posts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const likePost = async (postId: string): Promise<{ liked: boolean }> => {
  return apiFetch(`/api/community/posts/${postId}/like`, { method: 'POST' });
};

export const addComment = async (postId: string, content: string): Promise<PostComment> => {
  return apiFetch(`/api/community/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
};

// --- Community Data ---

export const getCommunityStats = async (): Promise<CommunityStats> => {
  return apiFetch('/api/community/stats');
};

export const getHotTopics = async (): Promise<HotTopic[]> => {
  return apiFetch('/api/community/hot-topics');
};

export const getTeamCommunities = async (): Promise<TeamCommunity[]> => {
  return apiFetch('/api/community/team-communities');
};

// --- MVP ---

export const getCurrentMVPVoting = async (): Promise<MVPVotingData> => {
  return apiFetch('/api/community/mvp-voting/current');
};

export const voteForMVP = async (playerId: number): Promise<void> => {
  await apiFetch('/api/community/mvp-votes', {
    method: 'POST',
    body: JSON.stringify({ player_id: playerId }),
  });
};

export const getMVPVotingResults = async (): Promise<MVPVoteResult[]> => {
  return apiFetch('/api/community/stats/mvp-votes');
};

export const getActivityLeaders = async (): Promise<
  Array<{ user_id: string; nickname: string; points: number; rank: number }>
> => {
  return apiFetch('/api/community/activity/leaders');
};
