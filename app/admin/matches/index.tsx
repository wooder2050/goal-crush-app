import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Redirect, Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { type AdminMatchItem, getAdminMatches } from '@/api/admin';
import { useAuth } from '@/components/AuthProvider';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PressableCard } from '@/components/ui/Card';

const STATUS_OPTIONS = [
  { key: '', label: '전체' },
  { key: 'scheduled', label: '예정' },
  { key: 'completed', label: '완료' },
  { key: 'cancelled', label: '취소' },
];

function MatchItem({ match, onPress }: { match: AdminMatchItem; onPress: () => void }) {
  return (
    <PressableCard className="mx-4 mb-2" onPress={onPress}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-sm font-medium text-neutral-900">
            {match.home_team.team_name} vs {match.away_team.team_name}
          </Text>
          {match.status === 'completed' && (
            <Text className="mt-1 text-lg font-bold text-neutral-900">
              {match.home_score} : {match.away_score}
              {match.penalty_home_score != null && (
                <Text className="text-sm text-neutral-500">
                  {' '}
                  (PK {match.penalty_home_score}:{match.penalty_away_score})
                </Text>
              )}
            </Text>
          )}
        </View>
        <View className="items-end">
          <Text className="text-xs text-neutral-400">
            {format(new Date(match.match_date), 'yy.MM.dd')}
          </Text>
          <View
            className={`mt-1 rounded px-2 py-0.5 ${match.status === 'completed' ? 'bg-green-100' : match.status === 'scheduled' ? 'bg-blue-100' : 'bg-neutral-100'}`}
          >
            <Text
              className={`text-xs ${match.status === 'completed' ? 'text-green-700' : match.status === 'scheduled' ? 'text-blue-700' : 'text-neutral-600'}`}
            >
              {match.status === 'completed'
                ? '완료'
                : match.status === 'scheduled'
                  ? '예정'
                  : match.status}
            </Text>
          </View>
          {match.season && (
            <Text className="mt-1 text-xs text-neutral-400">{match.season.season_name}</Text>
          )}
        </View>
      </View>
    </PressableCard>
  );
}

export default function AdminMatchesScreen() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [seasonId] = useState<number | undefined>(undefined);

  const {
    data: matches,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['adminMatches', status, seasonId],
    queryFn: () =>
      getAdminMatches({
        status: status || undefined,
        season_id: seasonId,
      }),
  });

  if (authLoading) return <LoadingSpinner />;
  if (!isAdmin) return <Redirect href="/" />;

  return (
    <>
      <Stack.Screen
        options={{
          title: '경기 관리',
          headerShown: true,
          headerRight: () => (
            <Pressable className="mr-4" onPress={() => router.push('/admin/matches/create')}>
              <Text className="text-sm font-semibold text-primary">새 경기</Text>
            </Pressable>
          ),
        }}
      />
      <View className="flex-1 bg-neutral-50">
        <View className="border-b border-neutral-200 bg-white px-4 py-2">
          <View className="flex-row gap-1">
            {STATUS_OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                className={`rounded-full px-3 py-1 ${status === opt.key ? 'bg-primary' : 'bg-neutral-100'}`}
                onPress={() => setStatus(opt.key)}
              >
                <Text
                  className={`text-xs font-medium ${status === opt.key ? 'text-white' : 'text-neutral-600'}`}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {isLoading ? (
          <LoadingSpinner />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <FlatList
            data={matches}
            keyExtractor={(item) => String(item.match_id)}
            renderItem={({ item }) => (
              <MatchItem
                match={item}
                onPress={() => router.push(`/admin/matches/${item.match_id}`)}
              />
            )}
            contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
            ListEmptyComponent={
              <View className="items-center py-16">
                <Text className="text-sm text-neutral-500">경기가 없습니다.</Text>
              </View>
            }
          />
        )}
      </View>
    </>
  );
}
