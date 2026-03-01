import { useInfiniteQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';

import { getPlayersPagePrisma, PlayersPageItem } from '@/api/players';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { PressableCard } from '@/components/ui/Card';

const POSITIONS = [
  { key: '', label: '전체' },
  { key: 'FW', label: '공격수' },
  { key: 'MF', label: '미드필더' },
  { key: 'DF', label: '수비수' },
  { key: 'GK', label: '골키퍼' },
];

function PlayerCard({ player }: { player: PlayersPageItem }) {
  const router = useRouter();
  const isGK = player.position === 'GK';

  return (
    <PressableCard
      className="mx-4 mb-3"
      onPress={() => router.push(`/players/${player.player_id}`)}
    >
      <View className="flex-row">
        {player.profile_image_url ? (
          <Image
            source={{ uri: player.profile_image_url }}
            style={{ width: 60, height: 80 }}
            className="rounded-lg"
            contentFit="cover"
          />
        ) : (
          <View className="h-20 w-[60px] items-center justify-center rounded-lg bg-neutral-200">
            <Text className="text-xl font-bold text-neutral-400">{player.name?.charAt(0)}</Text>
          </View>
        )}
        <View className="ml-3 flex-1 justify-center">
          <View className="flex-row items-center gap-2">
            {player.jersey_number != null && (
              <Text className="text-xs text-neutral-400">#{player.jersey_number}</Text>
            )}
            <Text className="text-base font-bold text-neutral-900">{player.name}</Text>
          </View>
          <View className="mt-1 flex-row items-center gap-1">
            {player.team && (
              <Text className="text-xs text-neutral-500">{player.team.team_name}</Text>
            )}
            {player.position && <Badge variant="outline">{player.position}</Badge>}
          </View>
          <View className="mt-2 flex-row gap-3">
            <Text className="text-xs text-neutral-500">출전 {player.totals.appearances}</Text>
            <Text className="text-xs text-neutral-500">골 {player.totals.goals}</Text>
            {isGK ? (
              <Text className="text-xs text-neutral-500">실점 {player.totals.goals_conceded}</Text>
            ) : (
              <Text className="text-xs text-neutral-500">도움 {player.totals.assists}</Text>
            )}
          </View>
        </View>
      </View>
    </PressableCard>
  );
}

export default function PlayersScreen() {
  const [position, setPosition] = useState('');
  const [searchName, setSearchName] = useState('');
  const [submittedName, setSubmittedName] = useState('');

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['playersPage', position, submittedName],
      queryFn: ({ pageParam }) =>
        getPlayersPagePrisma(pageParam as number, 15, {
          position: position || undefined,
          name: submittedName || undefined,
          order: 'apps',
        }),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextPage,
    });

  const handleSearch = useCallback(() => {
    setSubmittedName(searchName);
  }, [searchName]);

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const players = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <View className="flex-1 bg-neutral-50">
      <View className="border-b border-neutral-200 bg-white px-4 py-2">
        <View className="mb-2 flex-row items-center gap-2">
          <TextInput
            className="h-9 flex-1 rounded-lg border border-neutral-200 px-3 text-sm"
            placeholder="선수 이름 검색"
            value={searchName}
            onChangeText={setSearchName}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        <View className="flex-row gap-1">
          {POSITIONS.map((p) => (
            <Pressable
              key={p.key}
              className={`rounded-full px-3 py-1 ${position === p.key ? 'bg-primary' : 'bg-neutral-100'}`}
              onPress={() => setPosition(p.key)}
            >
              <Text
                className={`text-xs font-medium ${position === p.key ? 'text-white' : 'text-neutral-600'}`}
              >
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={players}
        keyExtractor={(item) => String(item.player_id)}
        renderItem={({ item }) => <PlayerCard player={item} />}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isFetchingNextPage ? <LoadingSpinner size="small" /> : null}
      />
    </View>
  );
}
