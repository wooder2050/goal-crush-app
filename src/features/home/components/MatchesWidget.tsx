import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { TeamLogo } from '@/components/TeamLogo';
import { Card } from '@/components/ui/Card';
import { H3 } from '@/components/ui/Typography';
import type { HomeMatch } from '@/features/home/types';

function MatchRow({ match, onPress }: { match: HomeMatch; onPress: () => void }) {
  const isCompleted = match.status === 'completed';
  const hasPenalty = match.penalty_home_score !== null && match.penalty_away_score !== null;

  const homeWon = isCompleted && (match.home_score ?? 0) > (match.away_score ?? 0);
  const awayWon = isCompleted && (match.away_score ?? 0) > (match.home_score ?? 0);

  return (
    <Pressable
      className="flex-row items-center border-b border-neutral-100 py-3 active:bg-neutral-50"
      onPress={onPress}
    >
      <View className="flex-1 flex-row items-center justify-end">
        <Text
          className={`mr-2 text-sm ${homeWon ? 'font-bold text-neutral-900' : 'text-neutral-600'}`}
          numberOfLines={1}
        >
          {match.home_team?.team_name}
        </Text>
        <TeamLogo uri={match.home_team?.logo} size={24} teamName={match.home_team?.team_name} />
      </View>

      <View className="mx-3 items-center">
        {isCompleted ? (
          <>
            <Text className="text-base font-bold text-neutral-900">
              {match.home_score} - {match.away_score}
            </Text>
            {hasPenalty && (
              <Text className="text-[10px] text-neutral-400">
                PK {match.penalty_home_score}-{match.penalty_away_score}
              </Text>
            )}
          </>
        ) : (
          <Text className="text-xs text-neutral-500">
            {match.match_date ? format(new Date(match.match_date), 'MM/dd HH:mm') : '미정'}
          </Text>
        )}
      </View>

      <View className="flex-1 flex-row items-center">
        <TeamLogo uri={match.away_team?.logo} size={24} teamName={match.away_team?.team_name} />
        <Text
          className={`ml-2 text-sm ${awayWon ? 'font-bold text-neutral-900' : 'text-neutral-600'}`}
          numberOfLines={1}
        >
          {match.away_team?.team_name}
        </Text>
      </View>
    </Pressable>
  );
}

export function MatchesWidget({
  recentMatches,
  upcomingMatches,
}: {
  recentMatches: HomeMatch[];
  upcomingMatches: HomeMatch[];
}) {
  const router = useRouter();

  if (recentMatches.length === 0 && upcomingMatches.length === 0) return null;

  return (
    <Card>
      {recentMatches.length > 0 && (
        <>
          <H3 className="mb-2">최근 결과</H3>
          {recentMatches.map((m) => (
            <MatchRow
              key={m.match_id}
              match={m}
              onPress={() => router.push(`/matches/${m.match_id}`)}
            />
          ))}
        </>
      )}
      {upcomingMatches.length > 0 && (
        <>
          <H3 className={recentMatches.length > 0 ? 'mb-2 mt-4' : 'mb-2'}>예정된 경기</H3>
          {upcomingMatches.map((m) => (
            <MatchRow
              key={m.match_id}
              match={m}
              onPress={() => router.push(`/matches/${m.match_id}`)}
            />
          ))}
        </>
      )}
    </Card>
  );
}
