import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Users } from 'lucide-react-native';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

import { apiFetch } from '@/api/client';
import type { FantasyTeam } from '@/api/fantasy';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { sanitizeLabel } from '@/lib/utils';

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
      <Stack.Screen
        options={{
          title: team.team_name,
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        className="flex-1 bg-neutral-50"
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => refetch()} tintColor="#ff4800" />
        }
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center bg-white px-5 pb-6 pt-4">
          <Text className="text-xl font-bold tracking-tight text-neutral-900">
            {team.team_name}
          </Text>
          <Text className="mt-1 text-3xl font-bold tabular-nums text-primary">
            {team.total_points}pt
          </Text>
          {team.season_name && (
            <Text className="mt-1 text-sm text-neutral-400">{sanitizeLabel(team.season_name)}</Text>
          )}
        </View>

        <View className="gap-3 px-5 pb-10 pt-4">
          <Card className="p-5">
            <View className="mb-3 flex-row items-center">
              <Users size={16} color="#ff4800" />
              <Text className="ml-2 text-base font-bold text-neutral-800">선수단</Text>
            </View>
            {team.players.map((p, i) => (
              <View
                key={p.player_id}
                className={`flex-row items-center py-3 ${i < team.players.length - 1 ? 'border-b border-neutral-100' : ''}`}
              >
                {p.profile_image_url ? (
                  <Image
                    source={{ uri: p.profile_image_url }}
                    style={{ width: 40, height: 40, borderRadius: 20 }}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
                    <Text className="text-sm font-bold text-neutral-300">{p.name?.charAt(0)}</Text>
                  </View>
                )}
                <View className="ml-3 flex-1">
                  <Text className="text-sm font-bold text-neutral-900">{p.name}</Text>
                  <Text className="mt-0.5 text-xs text-neutral-400">{p.team_name}</Text>
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
