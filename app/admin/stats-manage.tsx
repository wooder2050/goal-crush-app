import { useMutation } from '@tanstack/react-query';
import { Redirect, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import { regenerateAdminStats, validateAdminStats } from '@/api/admin';
import { useAuth } from '@/components/AuthProvider';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SeasonSelect } from '@/components/SeasonSelect';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const REGEN_TYPES = [
  { key: 'all' as const, label: '전체' },
  { key: 'standings' as const, label: '순위' },
  { key: 'player_stats' as const, label: '선수 통계' },
  { key: 'team_stats' as const, label: '팀 통계' },
  { key: 'h2h' as const, label: '상대전적' },
  { key: 'team_seasons' as const, label: '팀-시즌' },
];

export default function AdminStatsManageScreen() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [seasonId, setSeasonId] = useState<number | null>(null);

  const validateMut = useMutation({
    mutationFn: () => validateAdminStats(seasonId ?? undefined),
    onSuccess: (data) => {
      if (data.length === 0) {
        Alert.alert('검증 완료', '문제가 발견되지 않았습니다.');
      } else {
        Alert.alert('검증 결과', `${data.length}개의 불일치가 발견되었습니다.`);
      }
    },
    onError: (err: Error) => Alert.alert('오류', err.message),
  });

  const regenMut = useMutation({
    mutationFn: (
      type: 'all' | 'standings' | 'player_stats' | 'team_stats' | 'h2h' | 'team_seasons'
    ) => regenerateAdminStats(type, seasonId ?? undefined),
    onSuccess: (data) => {
      Alert.alert('성공', data.message || '통계가 재생성되었습니다.');
    },
    onError: (err: Error) => Alert.alert('오류', err.message),
  });

  if (authLoading) return <LoadingSpinner />;
  if (!isAdmin) return <Redirect href="/" />;

  return (
    <>
      <Stack.Screen options={{ title: '통계 관리', headerShown: true }} />
      <ScrollView className="flex-1 bg-neutral-50" contentContainerStyle={{ padding: 16 }}>
        <Card className="mb-4">
          <Text className="mb-2 text-sm font-semibold text-neutral-700">시즌 선택</Text>
          <SeasonSelect selectedSeasonId={seasonId} onSelect={setSeasonId} />
        </Card>

        <Card className="mb-4">
          <Text className="mb-2 text-sm font-semibold text-neutral-700">데이터 검증</Text>
          <Text className="mb-3 text-xs text-neutral-500">
            순위, 선수 통계, 팀 통계, 상대전적의 정합성을 검증합니다.
          </Text>
          <Button onPress={() => validateMut.mutate()} disabled={validateMut.isPending}>
            {validateMut.isPending ? '검증 중...' : '통계 검증 실행'}
          </Button>
        </Card>

        <Card>
          <Text className="mb-2 text-sm font-semibold text-neutral-700">통계 재생성</Text>
          <Text className="mb-3 text-xs text-neutral-500">
            경기 데이터를 기반으로 통계를 다시 계산합니다.
          </Text>
          {REGEN_TYPES.map((rt) => (
            <View key={rt.key} className="mb-2">
              <Button
                variant="outline"
                onPress={() =>
                  Alert.alert('재생성', `${rt.label} 통계를 재생성하시겠습니까?`, [
                    { text: '취소', style: 'cancel' },
                    { text: '확인', onPress: () => regenMut.mutate(rt.key) },
                  ])
                }
                disabled={regenMut.isPending}
              >
                {regenMut.isPending ? '처리 중...' : `${rt.label} 재생성`}
              </Button>
            </View>
          ))}
        </Card>
      </ScrollView>
    </>
  );
}
