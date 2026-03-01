import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Redirect, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Text, TextInput, View } from 'react-native';

import {
  createSeasonPrisma,
  deleteSeasonPrisma,
  getAllSeasonsPrisma,
  updateSeasonPrisma,
} from '@/api/seasons';
import { useAuth } from '@/components/AuthProvider';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function AdminSeasonsScreen() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: seasons,
    isLoading,
    isError,
    refetch,
  } = useQuery({ queryKey: ['allSeasons'], queryFn: getAllSeasonsPrisma });

  const [showForm, setShowForm] = useState(false);
  const [seasonName, setSeasonName] = useState('');
  const [year, setYear] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editYear, setEditYear] = useState('');

  const createMut = useMutation({
    mutationFn: createSeasonPrisma,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allSeasons'] });
      setSeasonName('');
      setYear('');
      setShowForm(false);
    },
    onError: (err: Error) => Alert.alert('오류', err.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { season_name: string; year: number } }) =>
      updateSeasonPrisma(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allSeasons'] });
      setEditId(null);
    },
    onError: (err: Error) => Alert.alert('오류', err.message),
  });

  const deleteMut = useMutation({
    mutationFn: deleteSeasonPrisma,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allSeasons'] }),
    onError: (err: Error) => Alert.alert('오류', err.message),
  });

  if (authLoading) return <LoadingSpinner />;
  if (!isAdmin) return <Redirect href="/" />;

  return (
    <>
      <Stack.Screen options={{ title: '시즌 관리', headerShown: true }} />
      <View className="flex-1 bg-neutral-50">
        {showForm ? (
          <Card className="m-4">
            <Text className="mb-2 text-sm font-semibold text-neutral-700">새 시즌 추가</Text>
            <TextInput
              className="mb-2 rounded border border-neutral-300 px-3 py-2 text-sm"
              placeholder="시즌 이름"
              value={seasonName}
              onChangeText={setSeasonName}
            />
            <TextInput
              className="mb-2 rounded border border-neutral-300 px-3 py-2 text-sm"
              placeholder="연도"
              value={year}
              onChangeText={setYear}
              keyboardType="number-pad"
            />
            <View className="flex-row gap-2">
              <Button
                size="sm"
                onPress={() => createMut.mutate({ season_name: seasonName, year: Number(year) })}
                disabled={!seasonName || !year}
              >
                추가
              </Button>
              <Button size="sm" variant="outline" onPress={() => setShowForm(false)}>
                취소
              </Button>
            </View>
          </Card>
        ) : (
          <View className="m-4">
            <Button size="sm" onPress={() => setShowForm(true)}>
              새 시즌 추가
            </Button>
          </View>
        )}

        {isLoading ? (
          <LoadingSpinner />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <FlatList
            data={seasons}
            keyExtractor={(s) => String(s.season_id)}
            renderItem={({ item }) => (
              <Card className="mx-4 mb-2">
                {editId === item.season_id ? (
                  <View>
                    <TextInput
                      className="mb-2 rounded border border-neutral-300 px-3 py-2 text-sm"
                      value={editName}
                      onChangeText={setEditName}
                    />
                    <TextInput
                      className="mb-2 rounded border border-neutral-300 px-3 py-2 text-sm"
                      value={editYear}
                      onChangeText={setEditYear}
                      keyboardType="number-pad"
                    />
                    <View className="flex-row gap-2">
                      <Button
                        size="sm"
                        onPress={() =>
                          updateMut.mutate({
                            id: item.season_id,
                            data: { season_name: editName, year: Number(editYear) },
                          })
                        }
                      >
                        저장
                      </Button>
                      <Button size="sm" variant="outline" onPress={() => setEditId(null)}>
                        취소
                      </Button>
                    </View>
                  </View>
                ) : (
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-sm font-medium text-neutral-900">
                        {item.season_name}
                      </Text>
                      <Text className="text-xs text-neutral-400">
                        ID: {item.season_id} · {item.year}
                      </Text>
                    </View>
                    <View className="flex-row gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onPress={() => {
                          setEditId(item.season_id);
                          setEditName(item.season_name);
                          setEditYear(String(item.year));
                        }}
                      >
                        수정
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onPress={() =>
                          Alert.alert('삭제', `${item.season_name}을(를) 삭제하시겠습니까?`, [
                            { text: '취소', style: 'cancel' },
                            {
                              text: '삭제',
                              style: 'destructive',
                              onPress: () => deleteMut.mutate(item.season_id),
                            },
                          ])
                        }
                      >
                        삭제
                      </Button>
                    </View>
                  </View>
                )}
              </Card>
            )}
            contentContainerStyle={{ paddingBottom: 24 }}
            ListEmptyComponent={
              <View className="items-center py-16">
                <Text className="text-sm text-neutral-500">시즌이 없습니다.</Text>
              </View>
            }
          />
        )}
      </View>
    </>
  );
}
