/**
 * Player Ability Rating System Types
 */

// 개별 능력치 인터페이스
export interface PlayerAbilities {
  // 공격 능력치
  finishing?: number;
  shot_power?: number;
  shot_accuracy?: number;
  heading?: number;

  // 패스 & 플레이메이킹
  short_passing?: number;
  long_passing?: number;
  vision?: number;
  crossing?: number;

  // 드리블 & 기술
  dribbling?: number;
  ball_control?: number;
  agility?: number;
  balance?: number;

  // 수비 능력
  marking?: number;
  tackling?: number;
  interceptions?: number;
  defensive_heading?: number;

  // 피지컬
  speed?: number;
  acceleration?: number;
  stamina?: number;
  strength?: number;

  // 멘탈
  determination?: number;
  work_rate?: number;
  leadership?: number;
  composure?: number;

  // 골키퍼 전용
  reflexes?: number;
  diving?: number;
  handling?: number;
  kicking?: number;
}

// 선수 능력치 평가 데이터
export interface PlayerAbilityRating extends PlayerAbilities {
  rating_id: number;
  player_id: number;
  user_id: string;
  season_id?: number;
  overall_rating?: number;
  comment?: string;
  helpful_count: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;

  // 관계 데이터
  player?: {
    player_id: number;
    name: string;
    profile_image_url?: string;
  };
  user?: {
    user_id: string;
    korean_nickname: string;
    profile_image_url?: string;
  };
  season?: {
    season_id: number;
    season_name: string;
  };
  reviews?: RatingReview[];
}

// 평가에 대한 리뷰
export interface RatingReview {
  review_id: number;
  rating_id: number;
  user_id: string;
  review_type: 'helpful' | 'not_helpful' | 'comment';
  comment?: string;
  created_at: string;

  // 관계 데이터
  user?: {
    user_id: string;
    korean_nickname: string;
    profile_image_url?: string;
  };
}

// 선수별 능력치 집계 데이터
export interface PlayerAbilityAggregate {
  player_id: number;
  season_id?: number;

  // 평균 능력치들 (모든 PlayerAbilities의 avg_ 버전)
  avg_finishing?: number;
  avg_shot_power?: number;
  avg_shot_accuracy?: number;
  avg_heading?: number;
  avg_short_passing?: number;
  avg_long_passing?: number;
  avg_vision?: number;
  avg_crossing?: number;
  avg_dribbling?: number;
  avg_ball_control?: number;
  avg_agility?: number;
  avg_balance?: number;
  avg_marking?: number;
  avg_tackling?: number;
  avg_interceptions?: number;
  avg_defensive_heading?: number;
  avg_speed?: number;
  avg_acceleration?: number;
  avg_stamina?: number;
  avg_strength?: number;
  avg_determination?: number;
  avg_work_rate?: number;
  avg_leadership?: number;
  avg_composure?: number;
  avg_reflexes?: number;
  avg_diving?: number;
  avg_handling?: number;
  avg_kicking?: number;
  avg_overall_rating?: number;

  total_ratings: number;
  last_updated: string;

  // 관계 데이터
  player?: {
    player_id: number;
    name: string;
    profile_image_url?: string;
  };
}

// API 요청/응답 타입들
export interface CreateRatingRequest extends PlayerAbilities {
  player_id: number;
  season_id?: number;
  overall_rating?: number;
  comment?: string;
}

export interface UpdateRatingRequest extends Partial<CreateRatingRequest> {
  rating_id: number;
}

export interface RatingListResponse {
  ratings: PlayerAbilityRating[];
  total_count: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface PlayerRatingsResponse {
  player: {
    player_id: number;
    name: string;
    profile_image_url?: string;
  };
  aggregate?: PlayerAbilityAggregate;
  user_ratings: PlayerAbilityRating[];
  top_ratings: PlayerAbilityRating[];
  has_user_rated: boolean; // 현재 사용자 평가 여부
}

// 능력치 카테고리 정의
export const ABILITY_CATEGORIES = {
  ATTACK: 'attack',
  PASSING: 'passing',
  DRIBBLING: 'dribbling',
  DEFENDING: 'defending',
  PHYSICAL: 'physical',
  MENTAL: 'mental',
  GOALKEEPER: 'goalkeeper',
} as const;

export type AbilityCategory = (typeof ABILITY_CATEGORIES)[keyof typeof ABILITY_CATEGORIES];

// 능력치별 메타데이터
export const ABILITY_METADATA: Record<
  keyof PlayerAbilities,
  {
    name: string;
    category: AbilityCategory;
    description: string;
    isGoalkeeperOnly?: boolean;
  }
> = {
  // 공격
  finishing: {
    name: '골 결정력',
    category: ABILITY_CATEGORIES.ATTACK,
    description: '슛 상황에서의 골 성공률',
  },
  shot_power: {
    name: '슈팅 파워',
    category: ABILITY_CATEGORIES.ATTACK,
    description: '슛의 강도와 위력',
  },
  shot_accuracy: {
    name: '슈팅 정확도',
    category: ABILITY_CATEGORIES.ATTACK,
    description: '슛의 정확성과 컨트롤',
  },
  heading: {
    name: '헤딩',
    category: ABILITY_CATEGORIES.ATTACK,
    description: '공중볼 상황에서의 헤딩 능력',
  },

  // 패스
  short_passing: {
    name: '짧은 패스',
    category: ABILITY_CATEGORIES.PASSING,
    description: '근거리 패스의 정확도',
  },
  long_passing: {
    name: '긴 패스',
    category: ABILITY_CATEGORIES.PASSING,
    description: '장거리 패스의 정확도',
  },
  vision: {
    name: '시야',
    category: ABILITY_CATEGORIES.PASSING,
    description: '경기 상황 판단력과 패스 타이밍',
  },
  crossing: {
    name: '크로스',
    category: ABILITY_CATEGORIES.PASSING,
    description: '사이드에서의 크로스 능력',
  },

  // 드리블
  dribbling: {
    name: '드리블',
    category: ABILITY_CATEGORIES.DRIBBLING,
    description: '볼을 소유한 상태에서의 돌파 능력',
  },
  ball_control: {
    name: '볼 컨트롤',
    category: ABILITY_CATEGORIES.DRIBBLING,
    description: '볼 터치와 볼 다루기 기술',
  },
  agility: {
    name: '민첩성',
    category: ABILITY_CATEGORIES.DRIBBLING,
    description: '빠른 방향 전환과 움직임',
  },
  balance: {
    name: '밸런스',
    category: ABILITY_CATEGORIES.DRIBBLING,
    description: '몸의 균형감과 안정성',
  },

  // 수비
  marking: {
    name: '마킹',
    category: ABILITY_CATEGORIES.DEFENDING,
    description: '상대 선수 견제 능력',
  },
  tackling: {
    name: '태클',
    category: ABILITY_CATEGORIES.DEFENDING,
    description: '볼 빼앗기와 수비 기술',
  },
  interceptions: {
    name: '인터셉트',
    category: ABILITY_CATEGORIES.DEFENDING,
    description: '패스 차단과 예측 능력',
  },
  defensive_heading: {
    name: '수비 헤딩',
    category: ABILITY_CATEGORIES.DEFENDING,
    description: '수비 상황에서의 헤딩 능력',
  },

  // 피지컬
  speed: {
    name: '스피드',
    category: ABILITY_CATEGORIES.PHYSICAL,
    description: '최고 속도와 달리기 능력',
  },
  acceleration: {
    name: '가속력',
    category: ABILITY_CATEGORIES.PHYSICAL,
    description: '순간적인 스피드 향상 능력',
  },
  stamina: {
    name: '스태미나',
    category: ABILITY_CATEGORIES.PHYSICAL,
    description: '경기 내내 지속되는 체력',
  },
  strength: {
    name: '근력',
    category: ABILITY_CATEGORIES.PHYSICAL,
    description: '몸싸움과 힘의 강도',
  },

  // 멘탈
  determination: {
    name: '승부욕',
    category: ABILITY_CATEGORIES.MENTAL,
    description: '경기에 대한 의지와 집중력',
  },
  work_rate: {
    name: '활동량',
    category: ABILITY_CATEGORIES.MENTAL,
    description: '경기 중 움직임의 양과 적극성',
  },
  leadership: {
    name: '리더십',
    category: ABILITY_CATEGORIES.MENTAL,
    description: '팀을 이끄는 능력과 카리스마',
  },
  composure: {
    name: '침착성',
    category: ABILITY_CATEGORIES.MENTAL,
    description: '중요한 순간에서의 냉정함',
  },

  // 골키퍼
  reflexes: {
    name: '반사신경',
    category: ABILITY_CATEGORIES.GOALKEEPER,
    description: '순간적인 반응 속도',
    isGoalkeeperOnly: true,
  },
  diving: {
    name: '다이빙',
    category: ABILITY_CATEGORIES.GOALKEEPER,
    description: '골대를 지키는 다이빙 능력',
    isGoalkeeperOnly: true,
  },
  handling: {
    name: '핸들링',
    category: ABILITY_CATEGORIES.GOALKEEPER,
    description: '공을 잡고 처리하는 기술',
    isGoalkeeperOnly: true,
  },
  kicking: {
    name: '킥',
    category: ABILITY_CATEGORIES.GOALKEEPER,
    description: '골킥과 패스의 정확도',
    isGoalkeeperOnly: true,
  },
};
