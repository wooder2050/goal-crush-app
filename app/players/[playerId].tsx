import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

import { getPlayerByIdPrisma, getPlayerSummaryPrisma } from '@/api/players';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TeamLogo } from '@/components/TeamLogo';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { H2, H3 } from '@/components/ui/Typography';

export default function PlayerDetailScreen() {
  const { playerId } = useLocalSearchParams<{ playerId: string }>();
  const id = Number(playerId);

  const {
    data: player,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['playerById', id],
    queryFn: () => getPlayerByIdPrisma(id),
  });

  const { data: summary } = useQuery({
    queryKey: ['playerSummary', id],
    queryFn: () => getPlayerSummaryPrisma(id),
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError || !player) return <ErrorState onRetry={() => refetch()} />;

  const isGK = summary?.primary_position === 'GK';

  return (
    <>
      <Stack.Screen options={{ title: player.name, headerShown: true }} />
      <ScrollView
        className="flex-1 bg-neutral-50"
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => refetch()} />}
      >
        <View className="items-center bg-white px-4 pb-4 pt-6">
          {player.profile_image_url ? (
            <Image
              source={{ uri: player.profile_image_url }}
              style={{ width: 120, height: 160 }}
              className="rounded-xl"
              contentFit="cover"
            />
          ) : (
            <View className="h-40 w-[120px] items-center justify-center rounded-xl bg-neutral-200">
              <Text className="text-3xl font-bold text-neutral-400">{player.name?.charAt(0)}</Text>
            </View>
          )}
          <View className="mt-3 flex-row items-center gap-2">
            {player.jersey_number != null && (
              <Text className="text-lg font-bold text-neutral-400">#{player.jersey_number}</Text>
            )}
            <H2>{player.name}</H2>
          </View>
        </View>

        <View className="gap-3 p-4">
          {summary && (
            <Card>
              <View className="flex-row justify-around">
                <View className="items-center">
                  <Text className="text-xl font-bold text-neutral-900">{summary.totals.goals}</Text>
                  <Text className="text-xs text-neutral-500">득점</Text>
                </View>
                <View className="items-center">
                  <Text className="text-xl font-bold text-neutral-900">
                    {summary.totals.appearances}
                  </Text>
                  <Text className="text-xs text-neutral-500">출전</Text>
                </View>
                <View className="items-center">
                  <Text className="text-xl font-bold text-neutral-900">
                    {summary.totals.assists}
                  </Text>
                  <Text className="text-xs text-neutral-500">어시스트</Text>
                </View>
                {isGK && (
                  <View className="items-center">
                    <Text className="text-xl font-bold text-neutral-900">
                      {summary.totals.goals_conceded}
                    </Text>
                    <Text className="text-xs text-neutral-500">실점</Text>
                  </View>
                )}
              </View>
            </Card>
          )}

          {summary?.positions_frequency && summary.positions_frequency.length > 0 && (
            <Card>
              <H3 className="mb-2">포지션</H3>
              <View className="flex-row flex-wrap gap-1">
                {summary.positions_frequency.map((pf) => (
                  <Badge key={pf.position} variant="outline">
                    {pf.position} ({pf.matches})
                  </Badge>
                ))}
              </View>
            </Card>
          )}

          {summary?.team_history && summary.team_history.length > 0 && (
            <Card>
              <H3 className="mb-2">소속팀 이력</H3>
              {summary.team_history.map((th, i) => (
                <View key={i} className="flex-row items-center border-b border-neutral-100 py-2">
                  <TeamLogo uri={th.logo} size={24} teamName={th.team_name ?? ''} />
                  <Text className="ml-2 flex-1 text-sm text-neutral-900">{th.team_name}</Text>
                  {th.is_active && <Badge variant="success">현재</Badge>}
                </View>
              ))}
            </Card>
          )}

          {summary?.seasons && summary.seasons.length > 0 && (
            <Card>
              <H3 className="mb-2">시즌별 기록</H3>
              {summary.seasons.map((s, i) => (
                <View key={i} className="border-b border-neutral-100 py-2">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-neutral-900">{s.season_name}</Text>
                      <Text className="text-xs text-neutral-500">{s.team_name}</Text>
                    </View>
                    <View className="flex-row gap-3">
                      <Text className="text-xs text-neutral-600">출전 {s.appearances}</Text>
                      <Text className="text-xs text-neutral-600">골 {s.goals}</Text>
                      <Text className="text-xs text-neutral-600">도움 {s.assists}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </Card>
          )}
        </View>
      </ScrollView>
    </>
  );
}
