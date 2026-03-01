import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { getStarterWinRate } from '@/api/stats';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SeasonSelect } from '@/components/SeasonSelect';
import type { WinRateRanking } from '@/features/stats/types/starter-win-rate';

function WinRateRow({ player }: { player: WinRateRanking }) {
  const router = useRouter();
  return (
    <Pressable
      className="flex-row items-center border-b border-neutral-100 px-4 py-3 active:bg-neutral-50"
      onPress={() => router.push(`/players/${player.player_id}`)}
    >
      <View className="h-6 w-6 items-center justify-center rounded-full bg-neutral-100">
        <Text className="text-xs font-bold text-neutral-500">{player.rank}</Text>
      </View>
      {player.player_image ? (
        <Image
          source={{ uri: player.player_image }}
          style={{ width: 36, height: 36 }}
          className="ml-2 rounded-full"
          contentFit="cover"
        />
      ) : (
        <View className="ml-2 h-9 w-9 items-center justify-center rounded-full bg-neutral-200">
          <Text className="text-sm font-bold text-neutral-400">
            {player.player_name?.charAt(0)}
          </Text>
        </View>
      )}
      <View className="ml-3 flex-1">
        <Text className="text-sm font-semibold text-neutral-900">{player.player_name}</Text>
        <Text className="text-xs text-neutral-500">{player.first_team_name ?? player.teams}</Text>
      </View>
      <View className="items-end">
        <Text className="text-base font-bold text-green-600">{player.win_rate}%</Text>
        <Text className="text-[10px] text-neutral-400">
          {player.matches_played}경기 {player.wins}승
        </Text>
      </View>
    </Pressable>
  );
}

export default function StarterWinRatePage() {
  const [seasonId, setSeasonId] = useState<number | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['starterWinRate', seasonId],
    queryFn: () =>
      getStarterWinRate({
        season_id: seasonId ?? undefined,
        limit: 50,
        appearance_type: 'starter',
      }),
  });

  return (
    <>
      <Stack.Screen options={{ title: '선발 승률', headerShown: true }} />
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
            renderItem={({ item }) => <WinRateRow player={item} />}
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
