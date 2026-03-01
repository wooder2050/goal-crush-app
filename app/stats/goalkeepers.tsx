import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { getGoalkeeperRankings, GoalkeeperRanking } from '@/api/stats';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SeasonSelect } from '@/components/SeasonSelect';

function GKRow({ gk, rank }: { gk: GoalkeeperRanking; rank: number }) {
  const router = useRouter();
  return (
    <Pressable
      className="flex-row items-center border-b border-neutral-100 px-4 py-3 active:bg-neutral-50"
      onPress={() => router.push(`/players/${gk.player_id}`)}
    >
      <View className="h-6 w-6 items-center justify-center rounded-full bg-neutral-100">
        <Text className="text-xs font-bold text-neutral-500">{rank}</Text>
      </View>
      {gk.player_image ? (
        <Image
          source={{ uri: gk.player_image }}
          style={{ width: 36, height: 36 }}
          className="ml-2 rounded-full"
          contentFit="cover"
        />
      ) : (
        <View className="ml-2 h-9 w-9 items-center justify-center rounded-full bg-neutral-200">
          <Text className="text-sm font-bold text-neutral-400">{gk.player_name?.charAt(0)}</Text>
        </View>
      )}
      <View className="ml-3 flex-1">
        <Text className="text-sm font-semibold text-neutral-900">{gk.player_name}</Text>
        <Text className="text-xs text-neutral-500">{gk.team_name}</Text>
      </View>
      <View className="items-end">
        <Text className="text-sm font-bold text-neutral-900">
          {gk.goals_conceded_per_match}실점/경기
        </Text>
        <Text className="text-[10px] text-neutral-400">
          클린시트 {gk.clean_sheets} ({gk.clean_sheet_percentage}%)
        </Text>
      </View>
    </Pressable>
  );
}

export default function GoalkeepersPage() {
  const [seasonId, setSeasonId] = useState<number | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['goalkeeperRankings', seasonId],
    queryFn: () => getGoalkeeperRankings({ season_id: seasonId ?? undefined, limit: 50 }),
  });

  return (
    <>
      <Stack.Screen options={{ title: '골키퍼 랭킹', headerShown: true }} />
      <View className="flex-1 bg-neutral-50">
        <SeasonSelect selectedSeasonId={seasonId} onSelect={setSeasonId} />
        {isLoading ? (
          <LoadingSpinner />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <FlatList
            data={data?.rankings ?? []}
            keyExtractor={(item) => String(item.player_id)}
            renderItem={({ item, index }) => <GKRow gk={item} rank={index + 1} />}
            contentContainerStyle={{ paddingBottom: 24 }}
            ListEmptyComponent={
              <View className="items-center py-16">
                <Text className="text-sm text-neutral-500">데이터가 없습니다.</Text>
              </View>
            }
          />
        )}
      </View>
    </>
  );
}
