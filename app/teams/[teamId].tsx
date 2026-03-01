import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { getTeamByIdPrisma, getTeamHighlightsPrisma, getTeamStatsPrisma } from '@/api/teams';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TeamLogo } from '@/components/TeamLogo';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { H2, H3 } from '@/components/ui/Typography';

export default function TeamDetailScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const router = useRouter();
  const id = Number(teamId);

  const {
    data: team,
    isLoading: teamLoading,
    isError: teamError,
    refetch: refetchTeam,
  } = useQuery({
    queryKey: ['teamById', id],
    queryFn: () => getTeamByIdPrisma(id),
  });

  const { data: stats } = useQuery({
    queryKey: ['teamStats', id],
    queryFn: () => getTeamStatsPrisma(id),
  });

  const { data: highlights } = useQuery({
    queryKey: ['teamHighlights', id],
    queryFn: () => getTeamHighlightsPrisma(id),
  });

  if (teamLoading) return <LoadingSpinner />;
  if (teamError || !team) return <ErrorState onRetry={() => refetchTeam()} />;

  return (
    <>
      <Stack.Screen options={{ title: team.team_name, headerShown: true }} />
      <ScrollView
        className="flex-1 bg-neutral-50"
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => refetchTeam()} />}
      >
        <View className="items-center bg-white px-4 pb-4 pt-6">
          <TeamLogo uri={team.logo} size={80} teamName={team.team_name} />
          <H2 className="mt-3">{team.team_name}</H2>
          {team.founded_year && (
            <Text className="mt-1 text-sm text-neutral-500">{team.founded_year}년 창단</Text>
          )}
          {team.description && (
            <Text className="mt-2 text-center text-sm text-neutral-600">{team.description}</Text>
          )}
        </View>

        <View className="gap-3 p-4">
          {highlights && (
            <View className="flex-row gap-2">
              {highlights.top_appearances && (
                <Card className="flex-1">
                  <Text className="text-[10px] text-neutral-500">최다 출장</Text>
                  <Pressable
                    onPress={() => router.push(`/players/${highlights.top_appearances!.player_id}`)}
                  >
                    <Text className="text-sm font-bold text-primary">
                      {highlights.top_appearances.name}
                    </Text>
                  </Pressable>
                  <Text className="text-xs text-neutral-600">
                    {highlights.top_appearances.appearances}경기
                  </Text>
                </Card>
              )}
              {highlights.top_scorer && (
                <Card className="flex-1">
                  <Text className="text-[10px] text-neutral-500">최다 득점</Text>
                  <Pressable
                    onPress={() => router.push(`/players/${highlights.top_scorer!.player_id}`)}
                  >
                    <Text className="text-sm font-bold text-primary">
                      {highlights.top_scorer.name}
                    </Text>
                  </Pressable>
                  <Text className="text-xs text-neutral-600">{highlights.top_scorer.goals}골</Text>
                </Card>
              )}
            </View>
          )}

          {stats && (
            <Card>
              <H3 className="mb-3">팀 통계</H3>
              <View className="flex-row justify-between">
                <View className="items-center">
                  <Text className="text-lg font-bold text-neutral-900">{stats.matches}</Text>
                  <Text className="text-xs text-neutral-500">경기</Text>
                </View>
                <View className="items-center">
                  <Text className="text-lg font-bold text-green-600">{stats.wins}</Text>
                  <Text className="text-xs text-neutral-500">승</Text>
                </View>
                <View className="items-center">
                  <Text className="text-lg font-bold text-red-600">{stats.losses}</Text>
                  <Text className="text-xs text-neutral-500">패</Text>
                </View>
                <View className="items-center">
                  <Text className="text-lg font-bold text-neutral-900">{stats.goals_for}</Text>
                  <Text className="text-xs text-neutral-500">득점</Text>
                </View>
                <View className="items-center">
                  <Text className="text-lg font-bold text-neutral-900">{stats.goals_against}</Text>
                  <Text className="text-xs text-neutral-500">실점</Text>
                </View>
                <View className="items-center">
                  <Text className="text-lg font-bold text-primary">{stats.win_rate}%</Text>
                  <Text className="text-xs text-neutral-500">승률</Text>
                </View>
              </View>
            </Card>
          )}

          {highlights && highlights.championships.count > 0 && (
            <Card>
              <H3 className="mb-2">우승 기록</H3>
              <View className="flex-row flex-wrap gap-1">
                {highlights.championships.seasons.map((s) => (
                  <Badge key={s.season_id} variant="warning">
                    {s.season_name}
                  </Badge>
                ))}
              </View>
            </Card>
          )}
        </View>
      </ScrollView>
    </>
  );
}
