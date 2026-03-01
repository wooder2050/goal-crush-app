// Fantasy 페이지들에서 사용하는 타입 정의

import { Position } from './fantasy';

// Prisma 모델 기반 타입들
export interface FantasyPlayerSelection {
  selection_id: number;
  fantasy_team_id: number;
  player_id: number;
  selection_order: number;
  position?: string | null;
  points_earned: number;
  created_at: Date;
  updated_at: Date;
}

// 선수 기본 정보
export interface PlayerBasic {
  player_id: number;
  name: string;
  profile_image_url?: string | null;
  jersey_number?: number | null;
}

// 매치 성과
export interface MatchPerformance {
  total_points: number;
  goal_points: number;
  assist_points: number;
}

// API에서 사용하는 확장된 FantasyPlayerSelection 타입들
export interface FantasyPlayerSelectionWithPlayer extends FantasyPlayerSelection {
  player: PlayerBasic;
  match_performances: MatchPerformance[];
}

export interface FantasyPlayerSelectionForEdit extends FantasyPlayerSelection {
  player: PlayerBasic & {
    player_team_history: Array<{
      team: {
        team_id: number;
        team_name: string;
        logo?: string | null;
        primary_color?: string | null;
        secondary_color?: string | null;
      } | null;
    }>;
    player_season_stats: Array<{
      goals: number | null;
      assists: number | null;
      matches_played: number | null;
    }>;
  };
}

// 선수 데이터 타입 (Prisma에서 가져온 원시 데이터)
export interface PlayerData {
  player_id: number;
  name: string;
  profile_image_url: string | null;
  jersey_number: number | null;
  player_team_history: Array<{
    team: {
      team_id: number;
      team_name: string;
      logo: string | null;
      primary_color: string | null;
      secondary_color: string | null;
    } | null;
  }>;
  player_season_stats: Array<{
    goals: number | null;
    assists: number | null;
    matches_played: number | null;
  }>;
}

// 포맷된 선수 데이터 타입
export interface FormattedPlayer {
  player_id: number;
  name: string;
  profile_image_url?: string;
  jersey_number?: number;
  current_team?: {
    team_id: number;
    team_name: string;
    logo?: string;
    primary_color?: string;
    secondary_color?: string;
  };
  season_stats: {
    goals: number;
    assists: number;
    matches_played: number;
  };
}

// 선수 선택 데이터 (포지션 포함)
export interface SelectedPlayer extends FormattedPlayer {
  position: Position;
}

// 판타지 시즌 정보
export interface FantasySeasonInfo {
  fantasy_season_id: number;
  year: number;
  month: number;
  lock_date: string;
  season: {
    season_name: string;
  };
}

// 팀 생성/수정 페이지 프롭스
export interface TeamBuilderProps {
  seasonId: number;
  fantasySeason: FantasySeasonInfo;
  availablePlayers: FormattedPlayer[];
  recommendedPlayers: FormattedPlayer[];
  initialSelectedPlayers: SelectedPlayer[];
  initialTeamName: string;
  isLocked: boolean;
  teamId?: number; // 수정 모드일 때만
}

// 팀 상세 페이지 관련 타입
export interface TeamDetailData {
  team_name: string | null;
  total_points: number;
  rank_position: number;
  total_teams: number;
}

export interface TeamDetailUser {
  name: string;
  avatar: string | null;
}

export interface TeamDetailSeason {
  fantasy_season_id: number;
  year: number;
  month: number;
  season_name: string;
  category: string;
}

// 랭킹 페이지 관련 타입
export interface PlayerSelection {
  points_earned: number;
  player: {
    name: string;
    profile_image_url: string | null;
  };
}

export interface RankingTeam {
  fantasy_team_id: number;
  team_name: string | null;
  total_points: number;
  rank_position: number;
  user: {
    user_id: string;
    korean_nickname: string | null;
    display_name: string | null;
    profile_image_url: string | null;
  };
  fantasy_team: {
    team_name: string | null;
    player_selections: PlayerSelection[];
  };
}

export interface RankingPagination {
  current_page: number;
  total_pages: number;
  total_teams: number;
  per_page: number;
}

export interface FantasySeasonWithRankings {
  fantasy_season_id: number;
  year: number;
  month: number;
  lock_date: Date;
  is_active: boolean;
  season: {
    season_name: string;
    category: string;
  };
  _count: {
    fantasy_teams: number;
  };
}

// API 요청/응답 타입
export interface GetPlayersDataRequest {
  season_id: number;
  fantasy_season_id: number;
}

export interface GetPlayersDataResponse {
  availablePlayers: FormattedPlayer[];
  recommendedPlayers: FormattedPlayer[];
}

export interface GetTeamDetailRequest {
  team_id: number;
}

export interface GetTeamDetailResponse {
  fantasyTeam: TeamDetailData;
  user: TeamDetailUser;
  fantasySeason: TeamDetailSeason;
  players: Array<
    FormattedPlayer & {
      position: Position;
      points_earned: number;
      season_stats: {
        goals: number;
        assists: number;
        matches_played: number;
      };
    }
  >;
}

export interface GetRankingsRequest {
  fantasy_season_id: number;
  page?: number;
  limit?: number;
}

export interface GetRankingsResponse {
  fantasy_season: FantasySeasonWithRankings;
  rankings: RankingTeam[];
  pagination: RankingPagination;
}

export interface GetUserRankingRequest {
  fantasy_season_id: number;
  user_id: string;
}

export interface GetUserRankingResponse {
  fantasy_team_id: number;
  team_name: string | null;
  total_points: number;
  rank_position: number;
}
