import { MatchWithTeams } from '@/lib/types/database';

/**
 * Return match result as string
 */
export const getMatchResult = (match: MatchWithTeams): string => {
  if (match.home_score === null || match.away_score === null) {
    return 'vs';
  }
  return `${match.home_score}:${match.away_score}`;
};

/**
 * Check if the match includes a penalty shootout
 */
export const hasPenaltyShootout = (match: MatchWithTeams): boolean => {
  return (
    match.penalty_home_score != null &&
    match.penalty_away_score != null &&
    typeof match.penalty_home_score === 'number' &&
    typeof match.penalty_away_score === 'number'
  );
};

/**
 * Determine the winner team ('home' | 'away' | 'draw' | null)
 */
export const getWinnerTeam = (match: MatchWithTeams): 'home' | 'away' | 'draw' | null => {
  if (match.home_score === null || match.away_score === null) {
    return null;
  }

  // First, check regular time result
  if (match.home_score > match.away_score) {
    return 'home';
  } else if (match.away_score > match.home_score) {
    return 'away';
  }

  // If tied, then check penalty shootout result
  if (match.home_score === match.away_score) {
    if (
      match.penalty_home_score != null &&
      match.penalty_away_score != null &&
      typeof match.penalty_home_score === 'number' &&
      typeof match.penalty_away_score === 'number'
    ) {
      if (match.penalty_home_score > match.penalty_away_score) {
        return 'home';
      } else if (match.penalty_away_score > match.penalty_home_score) {
        return 'away';
      }
    }
  }

  return 'draw';
};

/**
 * Return position color classes
 */
export const getPositionColor = (position: string): string => {
  const code = getPositionText(position);
  switch (code) {
    case 'GK':
      return 'bg-yellow-100 text-yellow-800';
    case 'DF':
      return 'bg-blue-100 text-blue-800';
    case 'MF':
      return 'bg-green-100 text-green-800';
    case 'FW':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Return shorthand position text
 */
export const getPositionText = (position: string): string => {
  switch (position) {
    case 'Goalkeeper':
      return 'GK';
    case 'Defender':
      return 'DF';
    case 'Midfielder':
      return 'MF';
    case 'Forward':
      return 'FW';
    default:
      return position;
  }
};

/**
 * Return sort order by position (Forward -> Midfielder -> Defender -> Goalkeeper)
 */
export const getPositionOrder = (position: string): number => {
  switch (position) {
    case 'Forward':
      return 0;
    case 'Midfielder':
      return 1;
    case 'Defender':
      return 2;
    case 'Goalkeeper':
      return 3;
    default:
      return 4;
  }
};
