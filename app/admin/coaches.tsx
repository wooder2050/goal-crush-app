import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Redirect, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Text, TextInput, View } from 'react-native';

import { createAdminCoach, deleteAdminCoach, updateAdminCoach } from '@/api/admin';
import { fetchCoaches } from '@/api/coaches';
import { useAuth } from '@/components/AuthProvider';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function AdminCoachesScreen() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['coaches'],
    queryFn: fetchCoaches,
  });

  const coaches = data?.coaches ?? [];

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const createMut = useMutation({
    mutationFn: createAdminCoach,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
      setName('');
      setShowForm(false);
    },
    onError: (err: Error) => Alert.alert('오류', err.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string } }) =>
      updateAdminCoach(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
      setEditId(null);
    },
    onError: (err: Error) => Alert.alert('오류', err.message),
  });

  const deleteMut = useMutation({
    mutationFn: deleteAdminCoach,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coaches'] }),
    onError: (err: Error) => Alert.alert('오류', err.message),
  });

  if (authLoading) return <LoadingSpinner />;
  if (!isAdmin) return <Redirect href="/" />;

  return (
    <>
      <Stack.Screen options={{ title: '코치 관리', headerShown: true }} />
      <View className="flex-1 bg-neutral-50">
        {showForm ? (
          <Card className="m-4">
            <Text className="mb-2 text-sm font-semibold text-neutral-700">새 코치 추가</Text>
            <TextInput
              className="mb-2 rounded border border-neutral-300 px-3 py-2 text-sm"
              placeholder="코치 이름"
              value={name}
              onChangeText={setName}
            />
            <View className="flex-row gap-2">
              <Button size="sm" onPress={() => createMut.mutate({ name })} disabled={!name}>
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
              새 코치 추가
            </Button>
          </View>
        )}

        {isLoading ? (
          <LoadingSpinner />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <FlatList
            data={coaches}
            keyExtractor={(c) => String(c.coach_id)}
            renderItem={({ item }) => (
              <Card className="mx-4 mb-2">
                {editId === item.coach_id ? (
                  <View>
                    <TextInput
                      className="mb-2 rounded border border-neutral-300 px-3 py-2 text-sm"
                      value={editName}
                      onChangeText={setEditName}
                    />
                    <View className="flex-row gap-2">
                      <Button
                        size="sm"
                        onPress={() =>
                          updateMut.mutate({ id: item.coach_id, data: { name: editName } })
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
                    <Text className="text-sm font-medium text-neutral-900">
                      [{item.coach_id}] {item.name}
                    </Text>
                    <View className="flex-row gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onPress={() => {
                          setEditId(item.coach_id);
                          setEditName(item.name);
                        }}
                      >
                        수정
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onPress={() =>
                          Alert.alert('삭제', `${item.name}을(를) 삭제하시겠습니까?`, [
                            { text: '취소', style: 'cancel' },
                            {
                              text: '삭제',
                              style: 'destructive',
                              onPress: () => deleteMut.mutate(item.coach_id),
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
                <Text className="text-sm text-neutral-500">코치가 없습니다.</Text>
              </View>
            }
          />
        )}
      </View>
    </>
  );
}
