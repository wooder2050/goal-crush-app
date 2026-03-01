import { z } from 'zod';

// Fantasy 점수 규칙 스키마
export const fantasyRulesSchema = z.object({
  version: z.string(),
  effective_date: z.string(),
  rules: z.object({
    appearance: z.object({
      played: z.number(),
      starter_bonus: z.number(),
    }),
    attack: z.object({
      goal: z.number(),
      assist: z.number(),
      multiple_goal_contribution_bonus: z.number(),
    }),
    defense: z.object({
      clean_sheet: z.number(),
      goalkeeper_save_per_2: z.number(),
      important_block_or_tackle: z.number(),
    }),
    deductions: z.object({
      yellow_card: z.number(),
      red_card: z.number(),
      own_goal: z.number(),
      missed_penalty: z.number(),
    }),
  }),
});

export type FantasyRules = z.infer<typeof fantasyRulesSchema>;

// 판타지 시즌 스키마
export const fantasySeasonSchema = z.object({
  fantasy_season_id: z.number(),
  season_id: z.number(),
  year: z.number(),
  month: z.number(),
  start_date: z.date(),
  end_date: z.date(),
  lock_date: z.date(),
  is_active: z.boolean(),
});

export type FantasySeason = z.infer<typeof fantasySeasonSchema>;

// 포지션 타입
export const positionSchema = z.enum(['GK', 'DF', 'MF', 'FW']);
export type Position = z.infer<typeof positionSchema>;

// 선수 선택 정보 스키마
export const playerSelectionInputSchema = z.object({
  player_id: z.number(),
  position: positionSchema,
});

// 판타지 팀 생성/수정 스키마
export const createFantasyTeamSchema = z.object({
  fantasy_season_id: z.number(),
  team_name: z.string().optional(),
  player_selections: z.array(playerSelectionInputSchema).length(5),
});

export const updateFantasyTeamSchema = z.object({
  fantasy_season_id: z.number().optional(), // POST 요청 시 포함될 수 있음
  team_name: z.string().optional(),
  player_selections: z.array(playerSelectionInputSchema).length(5).optional(),
});

export type CreateFantasyTeamRequest = z.infer<typeof createFantasyTeamSchema>;
export type UpdateFantasyTeamRequest = z.infer<typeof updateFantasyTeamSchema>;

// 선수 선택 검증 스키마
export const playerSelectionSchema = z.object({
  player_id: z.number(),
  team_id: z.number().optional(),
  name: z.string(),
  position: z.string().optional(),
});

export type PlayerSelection = z.infer<typeof playerSelectionSchema>;

// 팀 편성 규칙 검증
export const validateTeamComposition = (
  players: PlayerSelection[]
): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  // 5명 선택 확인
  if (players.length !== 5) {
    errors.push('정확히 5명의 선수를 선택해야 합니다.');
  }

  // 같은 팀 최대 2명 제한 확인
  const teamCounts = new Map<number, number>();
  players.forEach((player) => {
    if (player.team_id) {
      teamCounts.set(player.team_id, (teamCounts.get(player.team_id) || 0) + 1);
    }
  });

  teamCounts.forEach((count, teamId) => {
    if (count > 2) {
      errors.push(`같은 팀에서 최대 2명까지만 선택할 수 있습니다. (팀 ID: ${teamId})`);
    }
  });

  // 중복 선수 확인
  const playerIds = players.map((p) => p.player_id);
  const uniquePlayerIds = new Set(playerIds);
  if (playerIds.length !== uniquePlayerIds.size) {
    errors.push('중복된 선수를 선택할 수 없습니다.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// 판타지 점수 계산 타입
export interface FantasyMatchPerformance {
  performance_id: number;
  selection_id: number;
  match_id: number;
  player_id: number;
  appearance_points: number;
  goal_points: number;
  assist_points: number;
  clean_sheet_points: number;
  save_points: number;
  defensive_points: number;
  penalty_points: number;
  card_points: number;
  bonus_points: number;
  total_points: number;
}

// 월간 랭킹 타입
export interface FantasyRanking {
  ranking_id: number;
  fantasy_season_id: number;
  user_id: string;
  fantasy_team_id: number;
  rank_position: number;
  total_points: number;
  user: {
    korean_nickname: string;
    display_name?: string;
    profile_image_url?: string;
  };
  fantasy_team: {
    team_name?: string;
    player_selections: Array<{
      player: {
        name: string;
        profile_image_url?: string;
      };
      points_earned: number;
    }>;
  };
}

// AI 추천 타입
export interface FantasyAIRecommendation {
  recommendation_id: number;
  player_id: number;
  recommendation_score: number;
  reason?: string;
  form_score?: number;
  fixture_difficulty?: number;
  price_value?: number;
  player: {
    name: string;
    profile_image_url?: string;
    jersey_number?: number;
    player_team_history: Array<{
      team: {
        team_name: string;
        logo?: string;
      };
    }>;
  };
}

interface Player {
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
}

export interface PlayerWithPosition extends Player {
  position?: Position;
}

export interface PlayerPosition {
  player: PlayerWithPosition;
  position: Position;
  x: number; // 0-100 (percentage)
  y: number; // 0-100 (percentage)
}

export interface FootballPitchProps {
  players: PlayerWithPosition[];
  onPlayerClick?: (player: PlayerWithPosition) => void;
  onPositionChange?: (playerId: number, position: Position) => void;
  allowPositionChange?: boolean;
  className?: string;
}

// 통계 정보를 포함한 확장 타입
export interface PlayerWithStats extends PlayerWithPosition {
  season_stats: {
    // optional에서 required로 변경 (API에서 항상 제공됨)
    goals: number;
    assists: number;
    matches_played: number;
  };
  points_earned?: number;
  match_performances?: Array<{
    total_points: number;
  }>;
}

export interface MyTeamClientProps {
  seasonId: number;
  fantasySeason: {
    fantasy_season_id: number;
    year: number;
    month: number;
    lock_date: string;
    start_date: string;
    season: {
      season_name: string;
      category: string;
    };
  };
  fantasyTeam: {
    fantasy_team_id: number;
    team_name: string | null;
    total_points: number;
  };
  players: PlayerWithStats[];
  isLocked: boolean;
}
