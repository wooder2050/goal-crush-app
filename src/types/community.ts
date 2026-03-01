// 커뮤니티 관련 타입 정의

export interface CommunityStats {
  totalPosts: number;
  totalUsers: number;
  totalComments: number;
  totalLikes: number;
}

export interface HotTopic {
  id: number;
  title: string;
  category: string;
  likes_count: number;
  comments_count: number;
  views_count: number;
  unique_views: number; // 독립 조회 기록 수
  created_at: string;
}

export interface TeamCommunity {
  team_id: string;
  team_name: string;
  logo?: string | null;
  recent_posts_count: number;
  total_members: number;
  latest_post?: {
    title: string;
    created_at: string;
    user_nickname: string;
  } | null;
}

export interface CommunityPost {
  id: string;
  title: string;
  content?: string | null;
  created_at: string;
  updated_at: string;
  user_nickname: string;
  user_avatar?: string | null;
  likes_count: number;
  comments_count: number;
}

export interface MVPCandidate {
  player_id: number;
  player_name: string;
  team_name: string;
  votes_count: number;
  goals: number;
  assists: number;
  matches_played: number;
}

// 새로운 MVP API 응답 구조
export interface MatchMVP {
  match_id: number;
  match_date: string;
  winning_team: {
    team_id: number;
    team_name: string | null;
    logo: string | null;
  };
  score: {
    home: number;
    away: number;
  };
  mvp: {
    player_id: number;
    name: string;
    profile_image_url: string | null;
    jersey_number: number | null;
    goals: number; // 시즌 전체 골 수
    assists: number; // 시즌 전체 어시스트 수
  };
}

export interface MVPVotingData {
  season_id: number;
  season_name: string;
  match_mvps: MatchMVP[];
  total_matches: number;
  user_voted_player_id?: number | null;
  message: string;
}

export interface MVPVoteResult {
  player_id: number;
  player_name: string;
  team_name: string | null;
  jersey_number: number | null;
  profile_image_url: string | null;
  votes_count: number;
  goals: number;
  assists: number;
  mvp_count: number;
}

export interface PostCategory {
  value: string;
  label: string;
  description?: string;
}

export const POST_CATEGORIES: PostCategory[] = [
  { value: 'general', label: '일반', description: '자유로운 이야기' },
  { value: 'match', label: '경기', description: '경기 관련 이야기' },
  { value: 'team', label: '팀', description: '팀 관련 이야기' },
  { value: 'data', label: '데이터', description: '통계 및 분석' },
  { value: 'prediction', label: '예측', description: '경기 예측 및 전망' },
];
