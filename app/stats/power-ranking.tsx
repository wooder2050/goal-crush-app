import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { Info, X } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, Text, View } from 'react-native';

import type { PowerRankingRow } from '@/api/stats';
import { getPowerRanking } from '@/api/stats';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { sanitizeLabel } from '@/lib/utils';

const NUM = { fontVariant: ['tabular-nums' as const] };

const POSITION_STYLES: Record<string, { bg: string; text: string }> = {
  GK: { bg: 'bg-amber-400', text: 'text-white' },
  DF: { bg: 'bg-blue-400', text: 'text-white' },
  MF: { bg: 'bg-emerald-400', text: 'text-white' },
  FW: { bg: 'bg-rose-400', text: 'text-white' },
};

const FILTER_OPTIONS = ['전체', 'FW', 'MF', 'DF', 'GK'] as const;

/* ── 포지션 뱃지 ── */
function PosBadge({ position }: { position: string }) {
  const primary = position.split('/')[0];
  const style = POSITION_STYLES[primary] ?? { bg: 'bg-neutral-200', text: 'text-neutral-600' };
  return (
    <View className={`rounded px-1.5 py-0.5 ${style.bg}`}>
      <Text className={`text-[9px] font-bold ${style.text}`}>{position}</Text>
    </View>
  );
}

/* ── PI 점수 표시 ── */
function PIScore({ row }: { row: PowerRankingRow }) {
  const bgColor =
    row.rank === 1
      ? { backgroundColor: row.team_color ?? '#ff4800' }
      : row.rank <= 3
        ? { backgroundColor: '#111827' }
        : { backgroundColor: '#F3F4F6' };
  const textColor = row.rank <= 3 ? 'text-white' : 'text-neutral-700';

  return (
    <View className="items-center justify-center rounded-xl px-2.5 py-1.5" style={bgColor}>
      <Text className={`text-sm font-bold ${textColor}`} style={NUM}>
        {row.power_index.toFixed(1)}
      </Text>
    </View>
  );
}

/* ── 상세 모달 ── */
function DetailModal({
  visible,
  row,
  onClose,
}: {
  visible: boolean;
  row: PowerRankingRow | null;
  onClose: () => void;
}) {
  if (!row) return null;

  const total = row.breakdown.reduce((s, b) => s + b.contribution, 0);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <View className="rounded-t-3xl bg-white px-5 pb-10 pt-5" style={{ maxHeight: '70%' }}>
        {/* 헤더 */}
        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-row items-center" style={{ gap: 8 }}>
            {row.profile_image_url ? (
              <Image
                source={{ uri: row.profile_image_url }}
                style={{ width: 40, height: 40, borderRadius: 20 }}
                contentFit="cover"
              />
            ) : (
              <View className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
                <Text className="text-sm font-bold text-neutral-400">{row.name.charAt(0)}</Text>
              </View>
            )}
            <View>
              <View className="flex-row items-center" style={{ gap: 4 }}>
                <Text className="text-base font-bold text-neutral-800">{row.name}</Text>
                <PosBadge position={row.position} />
              </View>
              <Text className="text-xs text-neutral-400">{row.team_name}</Text>
            </View>
          </View>
          <Pressable onPress={onClose} hitSlop={12}>
            <X size={20} color="#737373" />
          </Pressable>
        </View>

        {/* PI 점수 */}
        <View
          className="mb-4 items-center rounded-2xl py-3"
          style={{ backgroundColor: (row.team_color ?? '#ff4800') + '15' }}
        >
          <Text
            className="text-3xl font-bold"
            style={[NUM, { color: row.team_color ?? '#ff4800' }]}
          >
            {row.power_index.toFixed(1)}
          </Text>
          <Text className="text-xs text-neutral-400">Power Index</Text>
        </View>

        {/* Breakdown 테이블 */}
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="mb-2 flex-row border-b border-neutral-100 pb-2">
            <Text className="flex-1 text-[10px] font-semibold text-neutral-400">지표</Text>
            <Text className="w-12 text-center text-[10px] font-semibold text-neutral-400">
              정규화
            </Text>
            <Text className="w-12 text-center text-[10px] font-semibold text-neutral-400">
              가중치
            </Text>
            <Text className="w-12 text-center text-[10px] font-semibold text-neutral-400">
              기여
            </Text>
          </View>
          {row.breakdown.map((b, i) => (
            <View key={i} className="flex-row items-center border-b border-neutral-50 py-2">
              <View className="flex-1">
                <Text className="text-xs text-neutral-700">{b.label}</Text>
                <Text className="text-[10px] text-neutral-400">{b.raw_value}</Text>
              </View>
              <Text className="w-12 text-center text-[11px] text-neutral-600" style={NUM}>
                {b.normalized.toFixed(2)}
              </Text>
              <Text className="w-12 text-center text-[11px] text-neutral-600" style={NUM}>
                {b.weight}
              </Text>
              <Text className="w-12 text-center text-[11px] font-bold text-neutral-800" style={NUM}>
                {b.contribution.toFixed(1)}
              </Text>
            </View>
          ))}
          <View className="mt-1 flex-row border-t border-neutral-200 pt-2">
            <Text className="flex-1 text-xs font-bold text-neutral-700">합계</Text>
            <Text className="w-12 text-center text-xs" />
            <Text className="w-12 text-center text-xs font-bold text-neutral-700" style={NUM}>
              100
            </Text>
            <Text className="w-12 text-center text-xs font-bold text-primary" style={NUM}>
              {total.toFixed(1)}
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ── 메인 페이지 ── */
export default function PowerRankingPage() {
  const [filter, setFilter] = useState<(typeof FILTER_OPTIONS)[number]>('전체');
  const [detailRow, setDetailRow] = useState<PowerRankingRow | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['powerRanking', 500],
    queryFn: () => getPowerRanking(500),
  });

  const filtered =
    filter === '전체'
      ? data?.rankings
      : data?.rankings.filter((r) => r.position.split('/')[0] === filter);

  const seasonName = data?.season ? sanitizeLabel(data.season.season_name) : '';

  return (
    <>
      <Stack.Screen
        options={{
          title: '파워랭킹',
          headerShown: true,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <View className="flex-1 bg-neutral-50">
        {/* 필터 + 시즌명 */}
        <View className="bg-white px-4 pb-3 pt-2">
          {seasonName ? <Text className="mb-2 text-xs text-neutral-400">{seasonName}</Text> : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row" style={{ gap: 6 }}>
              {FILTER_OPTIONS.map((opt) => (
                <Pressable
                  key={opt}
                  className={`rounded-full px-3.5 py-1.5 ${filter === opt ? 'bg-primary/10' : 'bg-neutral-100'}`}
                  onPress={() => setFilter(opt)}
                >
                  <Text
                    className={`text-xs font-semibold ${filter === opt ? 'text-primary' : 'text-neutral-500'}`}
                  >
                    {opt}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {isLoading ? (
          <LoadingSpinner />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <FlatList
            data={filtered ?? []}
            keyExtractor={(item) => String(item.player_id)}
            renderItem={({ item }) => (
              <Pressable
                className="flex-row items-center bg-white px-4 py-3 active:bg-neutral-50"
                onPress={() => setDetailRow(item)}
              >
                {/* 순위 */}
                <View
                  className={`h-6 w-6 items-center justify-center rounded-full ${item.rank <= 3 ? 'bg-primary/10' : 'bg-neutral-100'}`}
                >
                  <Text
                    className={`text-xs font-bold ${item.rank <= 3 ? 'text-primary' : 'text-neutral-500'}`}
                  >
                    {item.rank}
                  </Text>
                </View>

                {/* 프로필 */}
                <View style={{ marginLeft: 8 }}>
                  {item.profile_image_url ? (
                    <Image
                      source={{ uri: item.profile_image_url }}
                      style={{ width: 36, height: 36, borderRadius: 18 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-neutral-100">
                      <Text className="text-sm font-bold text-neutral-400">
                        {item.name.charAt(0)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* 이름 + 포지션 + 팀 */}
                <View className="ml-3 flex-1">
                  <View className="flex-row items-center" style={{ gap: 4 }}>
                    <Text className="text-sm font-semibold text-neutral-900" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <PosBadge position={item.position} />
                  </View>
                  <Text className="text-[11px] text-neutral-400">{item.team_name}</Text>
                </View>

                {/* PI */}
                <PIScore row={item} />
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View className="ml-14 h-px bg-neutral-50" />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
            ListEmptyComponent={<EmptyState title="데이터가 없습니다." />}
            ListFooterComponent={
              <View className="mx-4 mt-4 rounded-xl bg-neutral-100 p-3">
                <View className="flex-row items-center" style={{ gap: 4 }}>
                  <Info size={12} color="#a3a3a3" />
                  <Text className="text-[10px] font-semibold text-neutral-500">
                    파워 인덱스(PI)란?
                  </Text>
                </View>
                <Text className="mt-1 text-[10px] leading-4 text-neutral-400">
                  득점·도움·경기 평점·승률·액션 점수를 포지션별 가중치로 종합한 0~100점 스케일의
                  선수 순위입니다. 선수를 터치하면 상세 계산 내역을 확인할 수 있습니다.
                </Text>
              </View>
            }
          />
        )}
      </View>

      <DetailModal visible={detailRow != null} row={detailRow} onClose={() => setDetailRow(null)} />
    </>
  );
}
