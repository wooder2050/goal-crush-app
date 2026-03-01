import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';

import { getPlayersPagePrisma } from '@/api/players';
import { getPlayerVsTeam } from '@/api/stats';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SeasonSelect } from '@/components/SeasonSelect';
import { TeamLogo } from '@/components/TeamLogo';
import { Card } from '@/components/ui/Card';
import type { TeamRecord } from '@/features/stats/types/player-vs-team';

function RecordRow({ record }: { record: TeamRecord }) {
  const router = useRouter();
  return (
    <Pressable
      className="flex-row items-center border-b border-neutral-100 py-3 active:bg-neutral-50"
      onPress={() => router.push(`/teams/${record.opponent_team_id}`)}
    >
      <TeamLogo uri={record.opponent_team_logo} size={28} teamName={record.opponent_team_name} />
      <Text className="ml-2 flex-1 text-sm text-neutral-900">{record.opponent_team_name}</Text>
      <View className="items-end">
        <Text className="text-sm font-bold text-neutral-900">{record.attack_points}공격포인트</Text>
        <Text className="text-[10px] text-neutral-400">
          {record.matches_played}경기 {record.goals}골 {record.assists}도움
        </Text>
      </View>
    </Pressable>
  );
}

export default function PlayerVsTeamPage() {
  const [searchName, setSearchName] = useState('');
  const [submittedName, setSubmittedName] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [seasonId, setSeasonId] = useState<number | null>(null);

  const { data: searchResults } = useQuery({
    queryKey: ['playerSearch', submittedName],
    queryFn: () => getPlayersPagePrisma(1, 10, { name: submittedName }),
    enabled: submittedName.length > 0,
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['playerVsTeam', selectedPlayerId, seasonId],
    queryFn: () => getPlayerVsTeam(selectedPlayerId!, seasonId ?? undefined),
    enabled: selectedPlayerId !== null,
  });

  const handleSearch = useCallback(() => {
    setSubmittedName(searchName);
    setSelectedPlayerId(null);
  }, [searchName]);

  const showSearchResults = submittedName.length > 0 && selectedPlayerId === null;

  return (
    <>
      <Stack.Screen options={{ title: '선수 vs 팀', headerShown: true }} />
      <View className="flex-1 bg-neutral-50">
        <View className="border-b border-neutral-200 bg-white px-4 py-2">
          <TextInput
            className="h-9 rounded-lg border border-neutral-200 px-3 text-sm"
            placeholder="선수 이름 검색"
            value={searchName}
            onChangeText={setSearchName}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>

        {showSearchResults && (
          <View className="border-b border-neutral-200 bg-white">
            {searchResults?.items.map((p) => (
              <Pressable
                key={p.player_id}
                className="flex-row items-center px-4 py-2 active:bg-neutral-50"
                onPress={() => {
                  setSelectedPlayerId(p.player_id);
                  setSearchName(p.name ?? '');
                }}
              >
                {p.profile_image_url ? (
                  <Image
                    source={{ uri: p.profile_image_url }}
                    style={{ width: 28, height: 28 }}
                    className="rounded-full"
                    contentFit="cover"
                  />
                ) : (
                  <View className="h-7 w-7 items-center justify-center rounded-full bg-neutral-200">
                    <Text className="text-xs font-bold text-neutral-400">{p.name?.charAt(0)}</Text>
                  </View>
                )}
                <Text className="ml-2 text-sm text-neutral-900">{p.name}</Text>
                {p.team && (
                  <Text className="ml-2 text-xs text-neutral-500">{p.team.team_name}</Text>
                )}
              </Pressable>
            ))}
          </View>
        )}

        {selectedPlayerId && <SeasonSelect selectedSeasonId={seasonId} onSelect={setSeasonId} />}

        {selectedPlayerId ? (
          isLoading ? (
            <LoadingSpinner />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : data ? (
            <FlatList
              data={data.team_records}
              keyExtractor={(item) => String(item.opponent_team_id)}
              renderItem={({ item }) => <RecordRow record={item} />}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8 }}
              ListHeaderComponent={
                <Card className="mb-3">
                  <Text className="text-center text-base font-bold text-neutral-900">
                    {data.player_name}
                  </Text>
                  <Text className="mt-1 text-center text-xs text-neutral-500">상대팀별 성적</Text>
                </Card>
              }
              ListEmptyComponent={
                <View className="items-center py-16">
                  <Text className="text-sm text-neutral-500">기록이 없습니다.</Text>
                </View>
              }
            />
          ) : null
        ) : (
          <View className="items-center py-16">
            <Text className="text-sm text-neutral-500">선수를 검색하세요.</Text>
          </View>
        )}
      </View>
    </>
  );
}
