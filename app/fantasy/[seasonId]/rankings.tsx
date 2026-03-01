import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';

import { FantasyRanking, getFantasyRankings } from '@/api/fantasy';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';

function RankingRow({ ranking }: { ranking: FantasyRanking }) {
  const router = useRouter();
  const rankBg =
    ranking.rank === 1
      ? 'bg-amber-400'
      : ranking.rank === 2
        ? 'bg-neutral-300'
        : ranking.rank === 3
          ? 'bg-amber-600'
          : 'bg-neutral-100';
  const rankText = ranking.rank <= 3 ? 'text-white' : 'text-neutral-500';

  return (
    <Pressable
      className="flex-row items-center border-b border-neutral-100 px-4 py-3 active:bg-neutral-50"
      onPress={() => router.push(`/fantasy/team/${ranking.fantasy_team_id}`)}
    >
      <View className={`h-7 w-7 items-center justify-center rounded-full ${rankBg}`}>
        <Text className={`text-xs font-bold ${rankText}`}>{ranking.rank}</Text>
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-sm font-semibold text-neutral-900">{ranking.team_name}</Text>
        <Text className="text-xs text-neutral-500">{ranking.user_nickname}</Text>
      </View>
      <Text className="text-base font-bold text-primary">{ranking.total_points}pt</Text>
    </Pressable>
  );
}

export default function FantasyRankingsScreen() {
  const { seasonId } = useLocalSearchParams<{ seasonId: string }>();
  const id = Number(seasonId);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['fantasyRankings', id],
    queryFn: () => getFantasyRankings(id, 1, 50),
  });

  return (
    <>
      <Stack.Screen options={{ title: '판타지 랭킹', headerShown: true }} />
      <View className="flex-1 bg-neutral-50">
        {isLoading ? (
          <LoadingSpinner />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <FlatList
            data={data?.rankings ?? []}
            keyExtractor={(item) => String(item.fantasy_team_id)}
            renderItem={({ item }) => <RankingRow ranking={item} />}
            contentContainerStyle={{ paddingBottom: 24 }}
            ListEmptyComponent={
              <View className="items-center py-16">
                <Text className="text-sm text-neutral-500">참가자가 없습니다.</Text>
              </View>
            }
          />
        )}
      </View>
    </>
  );
}
