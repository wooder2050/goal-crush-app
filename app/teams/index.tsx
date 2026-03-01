import { useQuery } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { FlatList, Text, View } from 'react-native';

import { getTeamsPrisma } from '@/api/teams';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TeamLogo } from '@/components/TeamLogo';
import { Badge } from '@/components/ui/Badge';
import { PressableCard } from '@/components/ui/Card';
import type { TeamWithExtras } from '@/features/teams/types';

function TeamCard({ team }: { team: TeamWithExtras }) {
  const router = useRouter();
  return (
    <PressableCard className="mb-3 flex-1" onPress={() => router.push(`/teams/${team.team_id}`)}>
      <View className="items-center">
        <TeamLogo uri={team.logo} size={64} teamName={team.team_name} />
        <Text className="mt-2 text-center text-sm font-bold text-neutral-900" numberOfLines={1}>
          {team.team_name}
        </Text>
        {team.founded_year && (
          <Text className="mt-0.5 text-xs text-neutral-500">{team.founded_year}년 창단</Text>
        )}
        {(team.championships_count ?? 0) > 0 && (
          <View className="mt-1 flex-row flex-wrap justify-center gap-1">
            {team.championships?.slice(0, 3).map((c) => (
              <Badge key={c.season_id} variant="warning">
                {c.season_name}
              </Badge>
            ))}
          </View>
        )}
      </View>
    </PressableCard>
  );
}

export default function TeamsScreen() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['teamsAll'],
    queryFn: getTeamsPrisma,
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const teams = (data ?? []).sort(
    (a: TeamWithExtras, b: TeamWithExtras) =>
      (b.championships_count || 0) - (a.championships_count || 0)
  );

  return (
    <>
      <Stack.Screen options={{ title: '팀', headerShown: true }} />
      <FlatList
        className="flex-1 bg-neutral-50"
        data={teams}
        numColumns={2}
        keyExtractor={(item) => String(item.team_id)}
        renderItem={({ item }) => (
          <View className="w-1/2 px-2">
            <TeamCard team={item} />
          </View>
        )}
        columnWrapperStyle={{ paddingHorizontal: 8 }}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
      />
    </>
  );
}
