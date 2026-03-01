import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import {
  cancelSupport,
  createSupport,
  getUpcomingMatchesForSupport,
  getUserSupports,
  MatchSupport,
  UpcomingMatchForSupport,
} from '@/api/supports';
import { useAuth } from '@/components/AuthProvider';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TeamLogo } from '@/components/TeamLogo';
import { Card } from '@/components/ui/Card';

function UpcomingMatchCard({ match }: { match: UpcomingMatchForSupport }) {
  const queryClient = useQueryClient();
  const supportedTeamId = match.user_support?.team_id ?? null;

  const supportMutation = useMutation({
    mutationFn: (teamId: number) => createSupport({ matchId: match.match_id, teamId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcomingSupports'] });
      queryClient.invalidateQueries({ queryKey: ['mySupports'] });
    },
    onError: () => Alert.alert('오류', '응원 등록에 실패했습니다.'),
  });

  return (
    <Card className="mx-4 mb-3">
      <Text className="mb-2 text-center text-xs text-neutral-500">
        {format(new Date(match.match_date), 'yyyy.MM.dd HH:mm')}
      </Text>
      <View className="flex-row items-center justify-center gap-4">
        <Pressable
          className={`flex-1 items-center rounded-lg py-3 ${supportedTeamId === match.home_team.team_id ? 'border border-primary bg-primary/10' : 'bg-neutral-50'}`}
          onPress={() => supportMutation.mutate(match.home_team.team_id)}
          disabled={supportMutation.isPending}
        >
          <TeamLogo uri={match.home_team.logo} size={40} teamName={match.home_team.team_name} />
          <Text className="mt-1 text-sm font-semibold text-neutral-900">
            {match.home_team.team_name}
          </Text>
          {match.support_counts && (
            <Text className="text-xs text-neutral-400">{match.support_counts.home}명</Text>
          )}
        </Pressable>

        <Text className="text-lg font-bold text-neutral-300">VS</Text>

        <Pressable
          className={`flex-1 items-center rounded-lg py-3 ${supportedTeamId === match.away_team.team_id ? 'border border-primary bg-primary/10' : 'bg-neutral-50'}`}
          onPress={() => supportMutation.mutate(match.away_team.team_id)}
          disabled={supportMutation.isPending}
        >
          <TeamLogo uri={match.away_team.logo} size={40} teamName={match.away_team.team_name} />
          <Text className="mt-1 text-sm font-semibold text-neutral-900">
            {match.away_team.team_name}
          </Text>
          {match.support_counts && (
            <Text className="text-xs text-neutral-400">{match.support_counts.away}명</Text>
          )}
        </Pressable>
      </View>
    </Card>
  );
}

function MySupportCard({ support }: { support: MatchSupport }) {
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: () => cancelSupport(support.match_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mySupports'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingSupports'] });
    },
  });

  return (
    <Card className="mx-4 mb-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TeamLogo uri={support.team?.logo} size={24} teamName={support.team?.team_name} />
          <Text className="ml-2 text-sm font-semibold text-neutral-900">
            {support.team?.team_name}
          </Text>
        </View>
        {support.match?.status !== 'completed' && (
          <Pressable onPress={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
            <Text className="text-xs text-red-500">취소</Text>
          </Pressable>
        )}
      </View>
      {support.match && (
        <Text className="mt-1 text-xs text-neutral-500">
          {support.match.home_team.team_name} vs {support.match.away_team.team_name} ·{' '}
          {format(new Date(support.match.match_date), 'MM/dd')}
        </Text>
      )}
    </Card>
  );
}

export default function SupportsScreen() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'upcoming' | 'my'>('upcoming');

  const {
    data: upcomingMatches,
    isLoading: upcomingLoading,
    isError: upcomingError,
    refetch: refetchUpcoming,
  } = useQuery({
    queryKey: ['upcomingSupports'],
    queryFn: getUpcomingMatchesForSupport,
    enabled: !!user,
  });

  const {
    data: mySupports,
    isLoading: myLoading,
    refetch: refetchMy,
  } = useQuery({
    queryKey: ['mySupports'],
    queryFn: getUserSupports,
    enabled: !!user,
  });

  if (!user) {
    return (
      <>
        <Stack.Screen options={{ title: '응원', headerShown: true }} />
        <View className="flex-1 items-center justify-center bg-white">
          <Text className="text-sm text-neutral-500">로그인이 필요합니다.</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: '응원', headerShown: true }} />
      <View className="flex-1 bg-neutral-50">
        <View className="flex-row border-b border-neutral-200 bg-white">
          <Pressable
            className={`flex-1 items-center border-b-2 py-3 ${tab === 'upcoming' ? 'border-primary' : 'border-transparent'}`}
            onPress={() => setTab('upcoming')}
          >
            <Text
              className={`text-sm font-semibold ${tab === 'upcoming' ? 'text-primary' : 'text-neutral-400'}`}
            >
              응원할 경기
            </Text>
          </Pressable>
          <Pressable
            className={`flex-1 items-center border-b-2 py-3 ${tab === 'my' ? 'border-primary' : 'border-transparent'}`}
            onPress={() => setTab('my')}
          >
            <Text
              className={`text-sm font-semibold ${tab === 'my' ? 'text-primary' : 'text-neutral-400'}`}
            >
              내 응원
            </Text>
          </Pressable>
        </View>

        {tab === 'upcoming' ? (
          upcomingLoading ? (
            <LoadingSpinner />
          ) : upcomingError ? (
            <ErrorState onRetry={() => refetchUpcoming()} />
          ) : (
            <FlatList
              data={upcomingMatches ?? []}
              keyExtractor={(item) => String(item.match_id)}
              renderItem={({ item }) => <UpcomingMatchCard match={item} />}
              contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
              refreshControl={
                <RefreshControl refreshing={false} onRefresh={() => refetchUpcoming()} />
              }
              ListEmptyComponent={
                <View className="items-center py-16">
                  <Text className="text-sm text-neutral-500">예정된 경기가 없습니다.</Text>
                </View>
              }
            />
          )
        ) : myLoading ? (
          <LoadingSpinner />
        ) : (
          <FlatList
            data={mySupports ?? []}
            keyExtractor={(item) => String(item.support_id)}
            renderItem={({ item }) => <MySupportCard support={item} />}
            contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
            refreshControl={<RefreshControl refreshing={false} onRefresh={() => refetchMy()} />}
            ListEmptyComponent={
              <View className="items-center py-16">
                <Text className="text-sm text-neutral-500">응원 기록이 없습니다.</Text>
              </View>
            }
          />
        )}
      </View>
    </>
  );
}
