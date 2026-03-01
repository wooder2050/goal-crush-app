import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FlatList, Text, View } from 'react-native';

import { getSeasonsPagePrisma, SeasonWithStats } from '@/api/seasons';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TeamLogo } from '@/components/TeamLogo';
import { Badge } from '@/components/ui/Badge';
import { PressableCard } from '@/components/ui/Card';

const statusBadge = (status?: string) => {
  switch (status) {
    case 'ongoing':
      return <Badge variant="success">진행중</Badge>;
    case 'completed':
      return <Badge variant="default">완료</Badge>;
    case 'upcoming':
      return <Badge variant="warning">예정</Badge>;
    default:
      return <Badge variant="outline">미정</Badge>;
  }
};

function SeasonCard({ season }: { season: SeasonWithStats }) {
  const router = useRouter();
  return (
    <PressableCard
      className="mx-4 mb-3"
      onPress={() => router.push(`/seasons/${season.season_id}`)}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-base font-bold text-neutral-900" numberOfLines={1}>
            {season.season_name}
          </Text>
          <Text className="mt-0.5 text-xs text-neutral-500">{season.year}년</Text>
        </View>
        {statusBadge(season.status)}
      </View>

      {season.champion_team_name && (
        <View className="mt-2 flex-row items-center">
          <Text className="text-xs text-amber-600">{season.champion_label ?? '우승팀'}</Text>
          <TeamLogo
            uri={season.champion_team_logo}
            size={16}
            teamName={season.champion_team_name}
            className="ml-1"
          />
          <Text className="ml-1 text-xs font-medium text-neutral-700">
            {season.champion_team_name}
          </Text>
        </View>
      )}

      {(season.match_count ?? 0) > 0 && (
        <Text className="mt-1 text-xs text-neutral-400">{season.match_count}경기</Text>
      )}
    </PressableCard>
  );
}

export default function SeasonsScreen() {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['seasonsPage'],
      queryFn: ({ pageParam }) => getSeasonsPagePrisma(pageParam as number, 10),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextPage,
    });

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const seasons = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <FlatList
      className="flex-1 bg-neutral-50"
      data={seasons}
      keyExtractor={(item) => String(item.season_id)}
      renderItem={({ item }) => <SeasonCard season={item} />}
      contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
      onEndReached={() => hasNextPage && fetchNextPage()}
      onEndReachedThreshold={0.5}
      ListFooterComponent={isFetchingNextPage ? <LoadingSpinner size="small" /> : null}
    />
  );
}
