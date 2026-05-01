import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { createPlayerRating } from '@/api/player-ratings';
import { getPlayerByIdPrisma } from '@/api/players';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card } from '@/components/ui/Card';
import {
  ABILITY_CATEGORIES,
  ABILITY_METADATA,
  type AbilityCategory,
  type PlayerAbilities,
} from '@/features/player-ratings/types';

const NUM = { fontVariant: ['tabular-nums' as const] };

const CATEGORY_LABELS: Record<AbilityCategory, string> = {
  attack: '공격',
  passing: '패스',
  dribbling: '드리블',
  defending: '수비',
  physical: '피지컬',
  mental: '멘탈',
  goalkeeper: '골키퍼',
};

const CATEGORY_ORDER: AbilityCategory[] = [
  ABILITY_CATEGORIES.ATTACK,
  ABILITY_CATEGORIES.PASSING,
  ABILITY_CATEGORIES.DRIBBLING,
  ABILITY_CATEGORIES.DEFENDING,
  ABILITY_CATEGORIES.PHYSICAL,
  ABILITY_CATEGORIES.MENTAL,
  ABILITY_CATEGORIES.GOALKEEPER,
];

function getRatingGrade(rating: number): { label: string; color: string } {
  if (rating >= 86) return { label: '월드클래스', color: 'text-primary' };
  if (rating >= 71) return { label: '리그 상위권', color: 'text-emerald-500' };
  if (rating >= 51) return { label: '프로 평균', color: 'text-blue-500' };
  if (rating >= 31) return { label: '세미프로', color: 'text-amber-500' };
  return { label: '아마추어', color: 'text-neutral-400' };
}

/* ── 능력치 슬라이더 행 ── */
function AbilitySliderRow({
  abilityKey,
  value,
  onChange,
}: {
  abilityKey: keyof PlayerAbilities;
  value: number;
  onChange: (v: number) => void;
}) {
  const meta = ABILITY_METADATA[abilityKey];
  return (
    <View className="py-2.5">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-medium text-neutral-700">{meta.name}</Text>
        <Text className="text-xs font-bold text-primary" style={NUM}>
          {value}
        </Text>
      </View>
      <View className="mt-1.5 flex-row items-center" style={{ gap: 8 }}>
        <Pressable
          className="h-7 w-7 items-center justify-center rounded-full bg-neutral-100"
          onPress={() => onChange(Math.max(1, value - 5))}
        >
          <Text className="text-sm font-bold text-neutral-500">-</Text>
        </Pressable>
        <View className="flex-1">
          <View className="h-2 rounded-full bg-neutral-100">
            <View
              className="h-2 rounded-full bg-primary/30"
              style={{ width: `${((value - 1) / 98) * 100}%` }}
            />
          </View>
        </View>
        <Pressable
          className="h-7 w-7 items-center justify-center rounded-full bg-neutral-100"
          onPress={() => onChange(Math.min(99, value + 5))}
        >
          <Text className="text-sm font-bold text-neutral-500">+</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ── 메인 페이지 ── */
export default function PlayerRatePage() {
  const { playerId } = useLocalSearchParams<{ playerId: string }>();
  const id = Number(playerId);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: player, isLoading, isError } = useQuery({
    queryKey: ['playerById', id],
    queryFn: () => getPlayerByIdPrisma(id),
  });

  const [overallRating, setOverallRating] = useState(50);
  const [comment, setComment] = useState('');
  const [activeCategory, setActiveCategory] = useState<AbilityCategory>(ABILITY_CATEGORIES.ATTACK);

  // 모든 능력치 초기값 50
  const [abilities, setAbilities] = useState<Record<keyof PlayerAbilities, number>>(() => {
    const init: Record<string, number> = {};
    Object.keys(ABILITY_METADATA).forEach((key) => {
      init[key] = 50;
    });
    return init as Record<keyof PlayerAbilities, number>;
  });

  const updateAbility = (key: keyof PlayerAbilities, value: number) => {
    setAbilities((prev) => ({ ...prev, [key]: value }));
  };

  const categoryAbilities = Object.entries(ABILITY_METADATA).filter(
    ([, meta]) => meta.category === activeCategory
  );

  const mutation = useMutation({
    mutationFn: () =>
      createPlayerRating({
        player_id: id,
        overall_rating: overallRating,
        comment: comment || undefined,
        ...abilities,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playerRatings'] });
      Alert.alert('완료', '평가가 등록되었습니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    },
    onError: () => {
      Alert.alert('오류', '평가 등록에 실패했습니다. 로그인 상태를 확인해주세요.');
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError || !player) return <ErrorState onRetry={() => {}} />;

  const grade = getRatingGrade(overallRating);

  return (
    <>
      <Stack.Screen
        options={{
          title: `${player.name} 평가`,
          headerShown: true,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView className="flex-1 bg-neutral-50" showsVerticalScrollIndicator={false}>
          {/* 선수 정보 */}
          <View className="items-center bg-white px-5 pb-5 pt-4">
            {player.profile_image_url ? (
              <Image
                source={{ uri: player.profile_image_url }}
                style={{ width: 64, height: 64, borderRadius: 32 }}
                contentFit="cover"
              />
            ) : (
              <View className="h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                <Text className="text-2xl font-bold text-neutral-300">{player.name?.charAt(0)}</Text>
              </View>
            )}
            <Text className="mt-2 text-base font-bold text-neutral-900">{player.name}</Text>
          </View>

          <View style={{ gap: 12 }} className="px-4 pb-10 pt-4">
            {/* 종합 평점 */}
            <Card className="items-center px-4 py-5">
              <Text className="mb-2 text-sm font-bold text-neutral-800">종합 평점</Text>
              <Text className="text-5xl font-bold text-primary" style={NUM}>
                {overallRating}
              </Text>
              <Text className={`mt-1 text-xs font-semibold ${grade.color}`}>{grade.label}</Text>
              <View className="mt-3 w-full flex-row items-center" style={{ gap: 8 }}>
                <Pressable
                  className="h-8 w-8 items-center justify-center rounded-full bg-neutral-100"
                  onPress={() => setOverallRating(Math.max(1, overallRating - 1))}
                >
                  <Text className="text-base font-bold text-neutral-500">-</Text>
                </Pressable>
                <View className="flex-1">
                  <View className="h-3 rounded-full bg-neutral-100">
                    <View
                      className="h-3 rounded-full bg-primary"
                      style={{ width: `${((overallRating - 1) / 98) * 100}%` }}
                    />
                  </View>
                </View>
                <Pressable
                  className="h-8 w-8 items-center justify-center rounded-full bg-neutral-100"
                  onPress={() => setOverallRating(Math.min(99, overallRating + 1))}
                >
                  <Text className="text-base font-bold text-neutral-500">+</Text>
                </Pressable>
              </View>
            </Card>

            {/* 카테고리 탭 */}
            <Card className="p-4">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                <View className="flex-row" style={{ gap: 6 }}>
                  {CATEGORY_ORDER.map((cat) => (
                    <Pressable
                      key={cat}
                      className={`rounded-full px-3 py-1.5 ${activeCategory === cat ? 'bg-primary/10' : 'bg-neutral-100'}`}
                      onPress={() => setActiveCategory(cat)}
                    >
                      <Text
                        className={`text-xs font-semibold ${activeCategory === cat ? 'text-primary' : 'text-neutral-500'}`}
                      >
                        {CATEGORY_LABELS[cat]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              {categoryAbilities.map(([key]) => (
                <AbilitySliderRow
                  key={key}
                  abilityKey={key as keyof PlayerAbilities}
                  value={abilities[key as keyof PlayerAbilities]}
                  onChange={(v) => updateAbility(key as keyof PlayerAbilities, v)}
                />
              ))}
            </Card>

            {/* 코멘트 */}
            <Card className="p-4">
              <Text className="mb-2 text-sm font-bold text-neutral-800">평가 코멘트 (선택)</Text>
              <TextInput
                className="min-h-[80px] rounded-xl bg-neutral-50 px-3 py-2.5 text-sm text-neutral-800"
                placeholder="이 선수에 대한 평가를 남겨주세요..."
                placeholderTextColor="#a3a3a3"
                multiline
                textAlignVertical="top"
                value={comment}
                onChangeText={setComment}
              />
            </Card>

            {/* 제출 */}
            <Pressable
              className={`items-center rounded-2xl py-4 ${mutation.isPending ? 'bg-primary/50' : 'bg-primary'}`}
              onPress={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              <Text className="text-base font-bold text-white">
                {mutation.isPending ? '제출 중...' : '평가 제출'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
