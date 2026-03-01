import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { getPenaltyShootout, GoalkeeperPKRanking, KickerRanking } from '@/api/stats';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SeasonSelect } from '@/components/SeasonSelect';

type PKType = 'kicker' | 'goalkeeper';

function KickerRow({ player }: { player: KickerRanking }) {
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
        <Text className="text-xs text-neutral-500">{player.first_team_name}</Text>
      </View>
      <View className="items-end">
        <Text className="text-sm font-bold text-green-600">{player.success_rate}%</Text>
        <Text className="text-[10px] text-neutral-400">
          {player.successful_kicks}/{player.total_kicks} 성공
        </Text>
      </View>
    </Pressable>
  );
}

function GKPKRow({ player }: { player: GoalkeeperPKRanking }) {
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
        <Text className="text-xs text-neutral-500">{player.first_team_name}</Text>
      </View>
      <View className="items-end">
        <Text className="text-sm font-bold text-blue-600">{player.save_rate}%</Text>
        <Text className="text-[10px] text-neutral-400">
          {player.saves}/{player.total_faced} 선방
        </Text>
      </View>
    </Pressable>
  );
}

export default function PenaltyShootoutPage() {
  const [seasonId, setSeasonId] = useState<number | null>(null);
  const [type, setType] = useState<PKType>('kicker');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['penaltyShootout', type, seasonId],
    queryFn: () => getPenaltyShootout({ type, season_id: seasonId ?? undefined, limit: 50 }),
  });

  return (
    <>
      <Stack.Screen options={{ title: '승부차기', headerShown: true }} />
      <View className="flex-1 bg-neutral-50">
        <SeasonSelect selectedSeasonId={seasonId} onSelect={setSeasonId} />
        <View className="flex-row gap-1 border-b border-neutral-200 bg-white px-4 py-1.5">
          <Pressable
            className={`rounded-full px-4 py-1 ${type === 'kicker' ? 'bg-primary' : 'bg-neutral-100'}`}
            onPress={() => setType('kicker')}
          >
            <Text
              className={`text-xs font-medium ${type === 'kicker' ? 'text-white' : 'text-neutral-600'}`}
            >
              키커
            </Text>
          </Pressable>
          <Pressable
            className={`rounded-full px-4 py-1 ${type === 'goalkeeper' ? 'bg-primary' : 'bg-neutral-100'}`}
            onPress={() => setType('goalkeeper')}
          >
            <Text
              className={`text-xs font-medium ${type === 'goalkeeper' ? 'text-white' : 'text-neutral-600'}`}
            >
              골키퍼
            </Text>
          </Pressable>
        </View>

        {isLoading ? (
          <LoadingSpinner />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : type === 'kicker' ? (
          <FlatList
            data={(data?.rankings as KickerRanking[]) ?? []}
            keyExtractor={(item) => String(item.player_id)}
            renderItem={({ item }) => <KickerRow player={item} />}
            contentContainerStyle={{ paddingBottom: 24 }}
            ListEmptyComponent={
              <View className="items-center py-16">
                <Text className="text-sm text-neutral-500">데이터가 없습니다.</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={(data?.rankings as GoalkeeperPKRanking[]) ?? []}
            keyExtractor={(item) => String(item.player_id)}
            renderItem={({ item }) => <GKPKRow player={item} />}
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
