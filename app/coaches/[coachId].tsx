import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

import { fetchCoachFull } from '@/api/coaches';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TeamLogo } from '@/components/TeamLogo';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { H2, H3 } from '@/components/ui/Typography';

export default function CoachDetailScreen() {
  const { coachId } = useLocalSearchParams<{ coachId: string }>();
  const id = Number(coachId);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['coachFull', id],
    queryFn: () => fetchCoachFull(id),
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  const { coach, overview, current_team_verified } = data;

  return (
    <>
      <Stack.Screen options={{ title: coach.name, headerShown: true }} />
      <ScrollView
        className="flex-1 bg-neutral-50"
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => refetch()} />}
      >
        <View className="items-center bg-white px-4 pb-4 pt-6">
          {coach.profile_image_url ? (
            <Image
              source={{ uri: coach.profile_image_url }}
              style={{ width: 80, height: 80 }}
              className="rounded-full"
              contentFit="cover"
            />
          ) : (
            <View className="h-20 w-20 items-center justify-center rounded-full bg-neutral-200">
              <Text className="text-2xl font-bold text-neutral-400">{coach.name?.charAt(0)}</Text>
            </View>
          )}
          <H2 className="mt-3">{coach.name}</H2>
          {coach.nationality && (
            <Text className="mt-1 text-sm text-neutral-500">{coach.nationality}</Text>
          )}
          {current_team_verified ? (
            <View className="mt-2 flex-row items-center">
              <TeamLogo
                uri={current_team_verified.logo}
                size={20}
                teamName={current_team_verified.team_name}
              />
              <Text className="ml-1 text-sm text-neutral-700">
                {current_team_verified.team_name}
              </Text>
            </View>
          ) : (
            <Text className="mt-2 text-sm text-neutral-400">맡은 팀 없음</Text>
          )}
        </View>

        <View className="gap-3 p-4">
          <Card>
            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-xl font-bold text-neutral-900">{overview.total_matches}</Text>
                <Text className="text-xs text-neutral-500">총 경기</Text>
              </View>
              <View className="items-center">
                <Text className="text-xl font-bold text-green-600">
                  {overview.season_stats?.reduce((s: number, r) => s + r.wins, 0) ?? 0}
                </Text>
                <Text className="text-xs text-neutral-500">승리</Text>
              </View>
              <View className="items-center">
                <Text className="text-xl font-bold text-red-600">
                  {overview.season_stats?.reduce((s: number, r) => s + r.losses, 0) ?? 0}
                </Text>
                <Text className="text-xs text-neutral-500">패배</Text>
              </View>
            </View>
          </Card>

          {overview.trophies && overview.trophies.total > 0 && (
            <Card>
              <H3 className="mb-2">우승 기록</H3>
              <View className="flex-row flex-wrap gap-1">
                {overview.trophies.items.map((t, i) => (
                  <Badge key={i} variant="warning">
                    {t.season_name}
                  </Badge>
                ))}
              </View>
            </Card>
          )}

          {overview.season_stats && overview.season_stats.length > 0 && (
            <Card>
              <H3 className="mb-2">시즌별 통계</H3>
              {overview.season_stats.map((s) => (
                <View key={s.season_id} className="border-b border-neutral-100 py-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-medium text-neutral-900">{s.season_name}</Text>
                    <Text className="text-xs text-neutral-500">
                      {s.matches_played}경기 · 승률 {s.win_rate}%
                    </Text>
                  </View>
                  <View className="mt-1 flex-row gap-2">
                    {s.teams_detailed?.map((t) => (
                      <View key={t.team_id} className="flex-row items-center">
                        <TeamLogo uri={t.logo} size={14} teamName={t.team_name} />
                        <Text className="ml-1 text-xs text-neutral-500">{t.team_name}</Text>
                      </View>
                    ))}
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
