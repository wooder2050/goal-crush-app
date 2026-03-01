import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';

import { getUserProfile, updateNickname } from '@/api/user';
import { useAuth } from '@/components/AuthProvider';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card } from '@/components/ui/Card';
import { H2, H3 } from '@/components/ui/Typography';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');

  const {
    data: profileData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['userProfile'],
    queryFn: getUserProfile,
    enabled: !!user,
  });

  const nicknameMutation = useMutation({
    mutationFn: (nickname: string) => updateNickname(nickname),
    onSuccess: () => {
      setIsEditingNickname(false);
      setNewNickname('');
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      Alert.alert('완료', '닉네임이 변경되었습니다.');
    },
    onError: () => Alert.alert('오류', '닉네임 변경에 실패했습니다.'),
  });

  const handleNicknameSubmit = useCallback(() => {
    const trimmed = newNickname.trim();
    if (trimmed.length < 2 || trimmed.length > 10) {
      Alert.alert('알림', '닉네임은 2~10자로 입력하세요.');
      return;
    }
    nicknameMutation.mutate(trimmed);
  }, [newNickname, nicknameMutation]);

  const handleSignOut = useCallback(async () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/');
        },
      },
    ]);
  }, [signOut, router]);

  if (!user) {
    return (
      <>
        <Stack.Screen options={{ title: '프로필', headerShown: true }} />
        <View className="flex-1 items-center justify-center bg-white">
          <Text className="mb-4 text-sm text-neutral-500">로그인이 필요합니다.</Text>
          <Pressable
            className="rounded-lg bg-primary px-6 py-3"
            onPress={() => router.push('/auth/sign-in')}
          >
            <Text className="text-sm font-semibold text-white">로그인</Text>
          </Pressable>
        </View>
      </>
    );
  }

  if (isLoading) return <LoadingSpinner />;

  const profile = profileData?.user;

  return (
    <>
      <Stack.Screen options={{ title: '프로필', headerShown: true }} />
      <ScrollView
        className="flex-1 bg-neutral-50"
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => refetch()} />}
      >
        <View className="items-center bg-white px-4 py-6">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Text className="text-2xl font-bold text-primary">
              {profile?.korean_nickname?.charAt(0) ?? user.email?.charAt(0)?.toUpperCase()}
            </Text>
          </View>
          <H2 className="mt-3">{profile?.korean_nickname ?? '닉네임 없음'}</H2>
          <Text className="mt-1 text-sm text-neutral-500">{user.email}</Text>
        </View>

        <View className="gap-3 p-4">
          <Card>
            <H3 className="mb-3">프로필 정보</H3>

            <View className="flex-row items-center justify-between border-b border-neutral-100 py-3">
              <Text className="text-sm text-neutral-500">닉네임</Text>
              {isEditingNickname ? (
                <View className="flex-row items-center gap-2">
                  <TextInput
                    className="h-8 w-32 rounded border border-neutral-200 px-2 text-sm"
                    value={newNickname}
                    onChangeText={setNewNickname}
                    placeholder="새 닉네임"
                    maxLength={10}
                    autoFocus
                  />
                  <Pressable onPress={handleNicknameSubmit}>
                    <Text className="text-sm font-semibold text-primary">저장</Text>
                  </Pressable>
                  <Pressable onPress={() => setIsEditingNickname(false)}>
                    <Text className="text-sm text-neutral-400">취소</Text>
                  </Pressable>
                </View>
              ) : (
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm font-semibold text-neutral-900">
                    {profile?.korean_nickname ?? '-'}
                  </Text>
                  <Pressable
                    onPress={() => {
                      setNewNickname(profile?.korean_nickname ?? '');
                      setIsEditingNickname(true);
                    }}
                  >
                    <Text className="text-xs text-primary">변경</Text>
                  </Pressable>
                </View>
              )}
            </View>

            <View className="flex-row items-center justify-between border-b border-neutral-100 py-3">
              <Text className="text-sm text-neutral-500">이메일</Text>
              <Text className="text-sm text-neutral-900">{user.email}</Text>
            </View>

            {profile?.created_at && (
              <View className="flex-row items-center justify-between py-3">
                <Text className="text-sm text-neutral-500">가입일</Text>
                <Text className="text-sm text-neutral-900">
                  {format(new Date(profile.created_at), 'yyyy.MM.dd')}
                </Text>
              </View>
            )}
          </Card>

          <Pressable className="items-center rounded-xl bg-white py-4" onPress={handleSignOut}>
            <Text className="text-sm font-semibold text-red-500">로그아웃</Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}
