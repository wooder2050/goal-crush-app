import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, Text, View } from 'react-native';

import { getSeasonMatchesPagePrisma } from '@/api/matches';
import { getSeasonByIdPrisma } from '@/api/seasons';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TeamLogo } from '@/components/TeamLogo';
import { PressableCard } from '@/components/ui/Card';
import { MatchWithTeams } from '@/lib/types';

function MatchRow({ match }: { match: MatchWithTeams }) {
  const router = useRouter();
  const isCompleted = match.status === 'completed';
  const hasPenalty = match.penalty_home_score !== null && match.penalty_away_score !== null;

  return (
    <PressableCard className="mx-4 mb-2" onPress={() => router.push(`/matches/${match.match_id}`)}>
      <View className="flex-row items-center">
        <View className="flex-1 flex-row items-center justify-end">
          <Text className="mr-2 text-sm text-neutral-700" numberOfLines={1}>
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
              {match.match_date ? format(new Date(match.match_date), 'MM/dd HH:mm') : 'vs'}
            </Text>
          )}
        </View>

        <View className="flex-1 flex-row items-center">
          <TeamLogo uri={match.away_team?.logo} size={24} teamName={match.away_team?.team_name} />
          <Text className="ml-2 text-sm text-neutral-700" numberOfLines={1}>
            {match.away_team?.team_name}
          </Text>
        </View>
      </View>
    </PressableCard>
  );
}

export default function SeasonDetailScreen() {
  const { seasonId } = useLocalSearchParams<{ seasonId: string }>();
  const id = Number(seasonId);

  const { data: season, isLoading: seasonLoading } = useQuery({
    queryKey: ['seasonById', id],
    queryFn: () => getSeasonByIdPrisma(id),
  });

  const {
    data: matchesData,
    isLoading: matchesLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['seasonMatches', id],
    queryFn: ({ pageParam }) => getSeasonMatchesPagePrisma(id, pageParam as number, 10),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  const isLoading = seasonLoading || matchesLoading;

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const matches = matchesData?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <Stack.Screen options={{ title: season?.season_name ?? '시즌', headerShown: true }} />
      <FlatList
        className="flex-1 bg-neutral-50"
        data={matches}
        keyExtractor={(item) => String(item.match_id)}
        renderItem={({ item }) => <MatchRow match={item} />}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isFetchingNextPage ? <LoadingSpinner size="small" /> : null}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-sm text-neutral-500">경기 기록이 없습니다.</Text>
          </View>
        }
      />
    </>
  );
}
