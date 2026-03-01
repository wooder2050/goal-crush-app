import { Redirect, Stack, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { useAuth } from '@/components/AuthProvider';
import { PressableCard } from '@/components/ui/Card';

const MENU_ITEMS = [
  { label: '경기 관리', desc: '경기 생성, 스코어, 이벤트 기록', href: '/admin/matches' as const },
  { label: '팀 관리', desc: '팀 추가, 수정, 삭제', href: '/admin/teams' as const },
  { label: '선수 관리', desc: '선수 조회 및 관리', href: '/admin/players' as const },
  { label: '코치 관리', desc: '코치 추가, 수정, 삭제', href: '/admin/coaches' as const },
  { label: '시즌 관리', desc: '시즌 추가, 수정, 삭제', href: '/admin/seasons' as const },
  { label: '통계 관리', desc: '통계 검증, 재생성', href: '/admin/stats-manage' as const },
];

export default function AdminScreen() {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAdmin) {
    return <Redirect href="/" />;
  }

  return (
    <>
      <Stack.Screen options={{ title: '관리자', headerShown: true }} />
      <ScrollView className="flex-1 bg-neutral-50" contentContainerStyle={{ padding: 16 }}>
        <Text className="mb-4 text-xl font-bold text-neutral-900">관리자 메뉴</Text>
        {MENU_ITEMS.map((item) => (
          <PressableCard key={item.href} className="mb-3" onPress={() => router.push(item.href)}>
            <Text className="text-base font-semibold text-neutral-900">{item.label}</Text>
            <Text className="mt-1 text-sm text-neutral-500">{item.desc}</Text>
          </PressableCard>
        ))}
      </ScrollView>
    </>
  );
}
