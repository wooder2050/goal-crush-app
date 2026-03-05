import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight, Users } from 'lucide-react-native';
import { FlatList, Pressable, Text, View } from 'react-native';

import { FantasyRanking, getFantasyRankings } from '@/api/fantasy';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';

function RankingRow({ ranking }: { ranking: FantasyRanking }) {
  const router = useRouter();
  const isTop3 = ranking.rank <= 3;
  const rankBg =
    ranking.rank === 1
      ? 'bg-amber-400'
      : ranking.rank === 2
        ? 'bg-neutral-300'
        : ranking.rank === 3
          ? 'bg-amber-600'
          : 'bg-neutral-50';
  const rankText = isTop3 ? 'text-white' : 'text-neutral-500';

  return (
    <Pressable
      className={`mx-5 mb-2 flex-row items-center rounded-2xl border border-neutral-100 bg-white px-4 py-3.5 active:bg-neutral-50/80 ${isTop3 ? 'border-primary/10' : ''}`}
      onPress={() => router.push(`/fantasy/team/${ranking.fantasy_team_id}`)}
    >
      <View className={`h-8 w-8 items-center justify-center rounded-full ${rankBg}`}>
        <Text className={`text-xs font-bold tabular-nums ${rankText}`}>{ranking.rank}</Text>
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-sm font-bold text-neutral-900">{ranking.team_name}</Text>
        <Text className="mt-0.5 text-xs text-neutral-400">{ranking.user_nickname}</Text>
      </View>
      <Text className="mr-2 text-base font-bold tabular-nums text-primary">
        {ranking.total_points}pt
      </Text>
      <ChevronRight size={14} color="#d4d4d4" />
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
      <Stack.Screen
        options={{
          title: '판타지 랭킹',
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
        }}
      />
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
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyState icon={Users} message="아직 참가자가 없습니다." />}
          />
        )}
      </View>
    </>
  );
}
