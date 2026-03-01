import { useQuery } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { getTeamRankings, TeamRanking } from '@/api/stats';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SeasonSelect } from '@/components/SeasonSelect';
import { TeamLogo } from '@/components/TeamLogo';

function TeamRow({ team }: { team: TeamRanking }) {
  const router = useRouter();
  return (
    <Pressable
      className="flex-row items-center border-b border-neutral-100 px-4 py-3 active:bg-neutral-50"
      onPress={() => router.push(`/teams/${team.team_id}`)}
    >
      <View className="h-6 w-6 items-center justify-center rounded-full bg-neutral-100">
        <Text className="text-xs font-bold text-neutral-500">{team.rank}</Text>
      </View>
      <TeamLogo uri={team.team_logo} size={32} teamName={team.team_name} className="ml-2" />
      <View className="ml-3 flex-1">
        <Text className="text-sm font-semibold text-neutral-900">{team.team_name}</Text>
        <Text className="text-xs text-neutral-400">
          {team.matches_played}경기 {team.wins}승 {team.draws}무 {team.losses}패
        </Text>
      </View>
      <View className="items-end">
        <Text className="text-sm font-bold text-neutral-900">{team.win_rate}%</Text>
        <Text className="text-[10px] text-neutral-400">
          득실 {team.goal_difference > 0 ? '+' : ''}
          {team.goal_difference}
        </Text>
      </View>
    </Pressable>
  );
}

export default function TeamRankingsPage() {
  const [seasonId, setSeasonId] = useState<number | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['teamRankings', seasonId],
    queryFn: () => getTeamRankings({ season_id: seasonId ?? undefined, limit: 50 }),
  });

  return (
    <>
      <Stack.Screen options={{ title: '팀 랭킹', headerShown: true }} />
      <View className="flex-1 bg-neutral-50">
        <SeasonSelect selectedSeasonId={seasonId} onSelect={setSeasonId} />
        {isLoading ? (
          <LoadingSpinner />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <FlatList
            data={data?.rankings ?? []}
            keyExtractor={(item) => String(item.team_id)}
            renderItem={({ item }) => <TeamRow team={item} />}
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
