import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Stack, useRouter } from 'expo-router';
import { Heart, X } from 'lucide-react-native';
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
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TeamLogo } from '@/components/TeamLogo';
import { Button } from '@/components/ui/Button';
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
    <Card className="mx-5 mb-3 p-5">
      <Text className="mb-3 text-center text-xs font-medium text-neutral-400">
        {format(new Date(match.match_date), 'yyyy.MM.dd HH:mm')}
      </Text>
      <View className="flex-row items-center justify-center gap-4">
        <Pressable
          className={`flex-1 items-center rounded-2xl py-4 ${supportedTeamId === match.home_team.team_id ? 'border-2 border-primary bg-primary/5' : 'bg-neutral-50'}`}
          onPress={() => supportMutation.mutate(match.home_team.team_id)}
          disabled={supportMutation.isPending}
        >
          <TeamLogo uri={match.home_team.logo} size={44} teamName={match.home_team.team_name} />
          <Text className="mt-2 text-sm font-bold text-neutral-900">
            {match.home_team.team_name}
          </Text>
          {match.support_counts && (
            <View className="mt-1.5 flex-row items-center gap-1">
              <Heart
                size={10}
                color={supportedTeamId === match.home_team.team_id ? '#ff4800' : '#d4d4d4'}
                fill={supportedTeamId === match.home_team.team_id ? '#ff4800' : 'transparent'}
              />
              <Text className="text-xs tabular-nums text-neutral-400">
                {match.support_counts.home}
              </Text>
            </View>
          )}
        </Pressable>

        <Text className="text-base font-bold text-neutral-200">VS</Text>

        <Pressable
          className={`flex-1 items-center rounded-2xl py-4 ${supportedTeamId === match.away_team.team_id ? 'border-2 border-primary bg-primary/5' : 'bg-neutral-50'}`}
          onPress={() => supportMutation.mutate(match.away_team.team_id)}
          disabled={supportMutation.isPending}
        >
          <TeamLogo uri={match.away_team.logo} size={44} teamName={match.away_team.team_name} />
          <Text className="mt-2 text-sm font-bold text-neutral-900">
            {match.away_team.team_name}
          </Text>
          {match.support_counts && (
            <View className="mt-1.5 flex-row items-center gap-1">
              <Heart
                size={10}
                color={supportedTeamId === match.away_team.team_id ? '#ff4800' : '#d4d4d4'}
                fill={supportedTeamId === match.away_team.team_id ? '#ff4800' : 'transparent'}
              />
              <Text className="text-xs tabular-nums text-neutral-400">
                {match.support_counts.away}
              </Text>
            </View>
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
    <Card className="mx-5 mb-2.5 p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TeamLogo uri={support.team?.logo} size={28} teamName={support.team?.team_name} />
          <Text className="ml-2.5 text-sm font-bold text-neutral-900">
            {support.team?.team_name}
          </Text>
        </View>
        {support.match?.status !== 'completed' && (
          <Pressable
            className="rounded-full bg-neutral-100 p-1.5"
            onPress={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
          >
            <X size={12} color="#a3a3a3" />
          </Pressable>
        )}
      </View>
      {support.match && (
        <Text className="mt-1.5 text-xs text-neutral-400">
          {support.match.home_team.team_name} vs {support.match.away_team.team_name} ·{' '}
          {format(new Date(support.match.match_date), 'MM/dd')}
        </Text>
      )}
    </Card>
  );
}

export default function SupportsScreen() {
  const { user } = useAuth();
  const router = useRouter();
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
        <Stack.Screen
          options={{
            title: '응원',
            headerShown: true,
            headerStyle: { backgroundColor: '#fff' },
            headerShadowVisible: false,
          }}
        />
        <View className="flex-1 items-center justify-center bg-white px-6">
          <Heart size={40} color="#d4d4d4" />
          <Text className="mt-3 text-base font-semibold text-neutral-800">로그인이 필요합니다</Text>
          <Text className="mt-1 text-sm text-neutral-400">로그인 후 응원에 참여하세요</Text>
          <Button onPress={() => router.push('/auth/sign-in')} className="mt-5">
            로그인
          </Button>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: '응원',
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
        }}
      />
      <View className="flex-1 bg-neutral-50">
        <View className="flex-row bg-white">
          {(['upcoming', 'my'] as const).map((t) => (
            <Pressable
              key={t}
              className={`flex-1 items-center border-b-2 py-3.5 ${tab === t ? 'border-primary' : 'border-transparent'}`}
              onPress={() => setTab(t)}
            >
              <Text
                className={`text-sm font-semibold ${tab === t ? 'text-primary' : 'text-neutral-400'}`}
              >
                {t === 'upcoming' ? '응원할 경기' : '내 응원'}
              </Text>
            </Pressable>
          ))}
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
              contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={false}
                  onRefresh={() => refetchUpcoming()}
                  tintColor="#ff4800"
                />
              }
              ListEmptyComponent={
                <EmptyState
                  title="예정된 경기가 없습니다"
                  description="곧 새로운 경기가 등록됩니다"
                />
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
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={() => refetchMy()}
                tintColor="#ff4800"
              />
            }
            ListEmptyComponent={
              <EmptyState title="응원 기록이 없습니다" description="경기를 응원해보세요!" />
            }
          />
        )}
      </View>
    </>
  );
}
