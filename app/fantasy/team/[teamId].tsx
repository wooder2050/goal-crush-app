import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

import { apiFetch } from '@/api/client';
import type { FantasyTeam } from '@/api/fantasy';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { H3 } from '@/components/ui/Typography';

export default function FantasyTeamDetailScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const id = Number(teamId);

  const {
    data: team,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['fantasyTeamDetail', id],
    queryFn: () => apiFetch<FantasyTeam>(`/api/fantasy/teams/detail/${id}`),
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError || !team) return <ErrorState onRetry={() => refetch()} />;

  return (
    <>
      <Stack.Screen options={{ title: team.team_name, headerShown: true }} />
      <ScrollView
        className="flex-1 bg-neutral-50"
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => refetch()} />}
      >
        <View className="items-center bg-white px-4 py-6">
          <Text className="text-xl font-bold text-neutral-900">{team.team_name}</Text>
          <Text className="mt-1 text-3xl font-bold text-primary">{team.total_points}pt</Text>
          {team.season_name && (
            <Text className="mt-1 text-sm text-neutral-500">{team.season_name}</Text>
          )}
        </View>

        <View className="gap-3 p-4">
          <Card>
            <H3 className="mb-3">선수단</H3>
            {team.players.map((p) => (
              <View
                key={p.player_id}
                className="flex-row items-center border-b border-neutral-100 py-2"
              >
                {p.profile_image_url ? (
                  <Image
                    source={{ uri: p.profile_image_url }}
                    style={{ width: 36, height: 36 }}
                    className="rounded-full"
                    contentFit="cover"
                  />
                ) : (
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-neutral-200">
                    <Text className="text-sm font-bold text-neutral-400">{p.name?.charAt(0)}</Text>
                  </View>
                )}
                <View className="ml-3 flex-1">
                  <Text className="text-sm font-semibold text-neutral-900">{p.name}</Text>
                  <Text className="text-xs text-neutral-500">{p.team_name}</Text>
                </View>
                <Badge variant="outline">{p.position}</Badge>
              </View>
            ))}
          </Card>
        </View>
      </ScrollView>
    </>
  );
}
