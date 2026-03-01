import { useQuery } from '@tanstack/react-query';
import { Redirect, Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';

import { getPlayersPagePrisma } from '@/api/players';
import { useAuth } from '@/components/AuthProvider';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PressableCard } from '@/components/ui/Card';

export default function AdminPlayersScreen() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['adminPlayers', search],
    queryFn: () => getPlayersPagePrisma(1, 100, { name: search || undefined }),
  });

  if (authLoading) return <LoadingSpinner />;
  if (!isAdmin) return <Redirect href="/" />;

  const players = data?.items ?? [];

  return (
    <>
      <Stack.Screen options={{ title: '선수 관리', headerShown: true }} />
      <View className="flex-1 bg-neutral-50">
        <View className="border-b border-neutral-200 bg-white px-4 py-2">
          <TextInput
            className="rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm"
            placeholder="선수 이름 검색..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {isLoading ? (
          <LoadingSpinner />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <FlatList
            data={players}
            keyExtractor={(p) => String(p.player_id)}
            renderItem={({ item }) => (
              <PressableCard
                className="mx-4 mb-2"
                onPress={() => router.push(`/players/${item.player_id}`)}
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-sm font-medium text-neutral-900">
                      [{item.player_id}] {item.name}
                    </Text>
                    <Text className="text-xs text-neutral-400">
                      {item.team?.team_name ?? '무소속'} · {item.position ?? '-'} · #
                      {item.jersey_number ?? '-'}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-xs text-neutral-500">
                      {item.totals.appearances}경기 · {item.totals.goals}골 · {item.totals.assists}
                      도움
                    </Text>
                  </View>
                </View>
              </PressableCard>
            )}
            contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
            ListEmptyComponent={
              <View className="items-center py-16">
                <Text className="text-sm text-neutral-500">선수가 없습니다.</Text>
              </View>
            }
          />
        )}
      </View>
    </>
  );
}
