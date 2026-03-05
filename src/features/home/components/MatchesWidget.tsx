import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { TeamLogo } from '@/components/TeamLogo';
import { Card } from '@/components/ui/Card';
import type { HomeMatch } from '@/features/home/types';

const NUM_STYLE = { fontVariant: ['tabular-nums' as const] };

function SectionHeader({ title }: { title: string }) {
  return (
    <View className="mb-3 flex-row items-center">
      <View className="mr-2 h-4 w-1 rounded-full bg-primary" />
      <Text className="text-base font-bold text-neutral-800">{title}</Text>
    </View>
  );
}

function MatchRow({ match, onPress }: { match: HomeMatch; onPress: () => void }) {
  const isCompleted = match.status === 'completed';
  const hasPenalty = match.penalty_home_score !== null && match.penalty_away_score !== null;

  const homeWon = isCompleted && (match.home_score ?? 0) > (match.away_score ?? 0);
  const awayWon = isCompleted && (match.away_score ?? 0) > (match.home_score ?? 0);

  return (
    <Pressable
      className="flex-row items-center rounded-xl py-3 active:bg-neutral-50"
      onPress={onPress}
    >
      {/* 홈팀: 이름(shrink) + 로고(고정) */}
      <View className="min-w-0 flex-1 flex-row items-center justify-end">
        <Text
          className={`mr-2 shrink text-sm ${homeWon ? 'font-bold text-neutral-900' : 'text-neutral-500'}`}
          numberOfLines={1}
        >
          {match.home_team?.team_name}
        </Text>
        <TeamLogo uri={match.home_team?.logo} size={26} teamName={match.home_team?.team_name} />
      </View>

      {/* 스코어 / 일정 */}
      <View className="mx-3 min-w-[60px] items-center">
        {isCompleted ? (
          <>
            <Text className="text-base font-bold text-neutral-900" style={NUM_STYLE}>
              {match.home_score} : {match.away_score}
            </Text>
            {hasPenalty && (
              <Text className="text-[10px] text-neutral-400">
                PK {match.penalty_home_score}-{match.penalty_away_score}
              </Text>
            )}
          </>
        ) : (
          <View className="rounded-lg bg-neutral-100 px-2 py-1">
            <Text className="text-[11px] font-medium text-neutral-500">
              {match.match_date ? format(new Date(match.match_date), 'MM/dd HH:mm') : '미정'}
            </Text>
          </View>
        )}
      </View>

      {/* 원정팀: 로고(고정) + 이름(shrink) */}
      <View className="min-w-0 flex-1 flex-row items-center">
        <TeamLogo uri={match.away_team?.logo} size={26} teamName={match.away_team?.team_name} />
        <Text
          className={`ml-2 shrink text-sm ${awayWon ? 'font-bold text-neutral-900' : 'text-neutral-500'}`}
          numberOfLines={1}
        >
          {match.away_team?.team_name}
        </Text>
      </View>

      {/* 화살표: 고정 영역 */}
      <View className="ml-1 w-4 items-center">
        <ChevronRight size={14} color="#d4d4d4" />
      </View>
    </Pressable>
  );
}

export function MatchesWidget({
  recentMatches,
  upcomingMatches,
  seasonId,
}: {
  recentMatches: HomeMatch[];
  upcomingMatches: HomeMatch[];
  seasonId?: number;
}) {
  const router = useRouter();

  if (recentMatches.length === 0 && upcomingMatches.length === 0) return null;

  return (
    <Card className="p-5">
      {recentMatches.length > 0 && (
        <>
          <SectionHeader title="최근 결과" />
          <View className="divide-neutral-100">
            {recentMatches.map((m) => (
              <MatchRow
                key={m.match_id}
                match={m}
                onPress={() => router.push(`/matches/${m.match_id}`)}
              />
            ))}
          </View>
        </>
      )}
      {upcomingMatches.length > 0 && (
        <>
          <View className={recentMatches.length > 0 ? 'mt-5' : ''}>
            <SectionHeader title="예정된 경기" />
          </View>
          <View className="divide-neutral-100">
            {upcomingMatches.map((m) => (
              <MatchRow
                key={m.match_id}
                match={m}
                onPress={() => router.push(`/matches/${m.match_id}`)}
              />
            ))}
          </View>
        </>
      )}

      {/* 전체 경기 보기 */}
      {seasonId && (
        <Pressable
          className="mt-4 flex-row items-center justify-center rounded-xl bg-neutral-50 py-2.5 active:bg-neutral-100"
          onPress={() => router.push(`/seasons/${seasonId}?tab=matches`)}
        >
          <Text className="text-[13px] font-semibold text-neutral-500">전체 경기 보기</Text>
          <ChevronRight size={14} color="#a3a3a3" style={{ marginLeft: 2 }} />
        </Pressable>
      )}
    </Card>
  );
}
