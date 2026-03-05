import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Stack, useRouter } from 'expo-router';
import { Calendar, LogOut, Mail, Pencil } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';

import { getUserProfile, updateNickname } from '@/api/user';
import { useAuth } from '@/components/AuthProvider';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

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
        <Stack.Screen
          options={{
            title: '프로필',
            headerShown: true,
            headerStyle: { backgroundColor: '#fff' },
            headerShadowVisible: false,
          }}
        />
        <View className="flex-1 items-center justify-center bg-white px-6">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
            <Text className="text-2xl text-neutral-300">?</Text>
          </View>
          <Text className="mb-1 text-base font-semibold text-neutral-800">로그인이 필요합니다</Text>
          <Text className="mb-6 text-sm text-neutral-400">프로필을 확인하려면 로그인하세요</Text>
          <Button onPress={() => router.push('/auth/sign-in')}>로그인</Button>
        </View>
      </>
    );
  }

  if (isLoading) return <LoadingSpinner />;

  const profile = profileData?.user;

  return (
    <>
      <Stack.Screen
        options={{
          title: '프로필',
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
          <View className="h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Text className="text-2xl font-bold text-primary">
              {profile?.korean_nickname?.charAt(0) ?? user.email?.charAt(0)?.toUpperCase()}
            </Text>
          </View>
          <Text className="mt-3 text-xl font-bold text-neutral-900">
            {profile?.korean_nickname ?? '닉네임 없음'}
          </Text>
          <Text className="mt-1 text-sm text-neutral-400">{user.email}</Text>
        </View>

        <View className="gap-3 px-5 pb-10 pt-4">
          <Card className="p-5">
            <View className="mb-4 flex-row items-center">
              <View className="mr-2 h-4 w-1 rounded-full bg-primary" />
              <Text className="text-base font-bold text-neutral-800">프로필 정보</Text>
            </View>

            <View className="flex-row items-center justify-between border-b border-neutral-100 py-3.5">
              <View className="flex-row items-center">
                <Pencil size={14} color="#a3a3a3" />
                <Text className="ml-2 text-sm text-neutral-500">닉네임</Text>
              </View>
              {isEditingNickname ? (
                <View className="flex-row items-center gap-2">
                  <TextInput
                    className="h-8 w-28 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 text-sm"
                    value={newNickname}
                    onChangeText={setNewNickname}
                    placeholder="새 닉네임"
                    maxLength={10}
                    autoFocus
                  />
                  <Pressable onPress={handleNicknameSubmit}>
                    <Text className="text-sm font-bold text-primary">저장</Text>
                  </Pressable>
                  <Pressable onPress={() => setIsEditingNickname(false)}>
                    <Text className="text-sm text-neutral-400">취소</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  className="flex-row items-center gap-1.5"
                  onPress={() => {
                    setNewNickname(profile?.korean_nickname ?? '');
                    setIsEditingNickname(true);
                  }}
                >
                  <Text className="text-sm font-semibold text-neutral-900">
                    {profile?.korean_nickname ?? '-'}
                  </Text>
                  <Text className="text-xs text-primary">변경</Text>
                </Pressable>
              )}
            </View>

            <View className="flex-row items-center justify-between border-b border-neutral-100 py-3.5">
              <View className="flex-row items-center">
                <Mail size={14} color="#a3a3a3" />
                <Text className="ml-2 text-sm text-neutral-500">이메일</Text>
              </View>
              <Text className="text-sm text-neutral-900">{user.email}</Text>
            </View>

            {profile?.created_at && (
              <View className="flex-row items-center justify-between py-3.5">
                <View className="flex-row items-center">
                  <Calendar size={14} color="#a3a3a3" />
                  <Text className="ml-2 text-sm text-neutral-500">가입일</Text>
                </View>
                <Text className="text-sm text-neutral-900">
                  {format(new Date(profile.created_at), 'yyyy.MM.dd')}
                </Text>
              </View>
            )}
          </Card>

          <Pressable
            className="flex-row items-center justify-center gap-2 rounded-2xl border border-red-100 bg-white py-4"
            onPress={handleSignOut}
          >
            <LogOut size={16} color="#ef4444" />
            <Text className="text-sm font-semibold text-red-500">로그아웃</Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}
