import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Search, X } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { searchPlayersByNamePrisma } from '@/api/players';
import type { CompareResponse, SeasonBreakdownEntry } from '@/api/stats';
import { getPlayerCompare } from '@/api/stats';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card } from '@/components/ui/Card';
import { sanitizeLabel } from '@/lib/utils';

const NUM = { fontVariant: ['tabular-nums' as const] };

type SelectedPlayer = { player_id: number; name: string; profile_image_url: string | null };

/* ── 선수 검색 모달 ── */
function PlayerSearchModal({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (p: SelectedPlayer) => void;
}) {
  const [query, setQuery] = useState('');

  const { data: results } = useQuery({
    queryKey: ['playerSearch', query],
    queryFn: () => searchPlayersByNamePrisma(query),
    enabled: query.length >= 1,
  });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-white pt-14">
        <View className="flex-row items-center border-b border-neutral-100 px-4 pb-3">
          <View className="mr-3 flex-1 flex-row items-center rounded-xl bg-neutral-100 px-3 py-2.5">
            <Search size={16} color="#a3a3a3" />
            <TextInput
              className="ml-2 flex-1 text-sm text-neutral-900"
              placeholder="선수 이름 검색"
              placeholderTextColor="#a3a3a3"
              value={query}
              onChangeText={setQuery}
              autoFocus
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <X size={14} color="#a3a3a3" />
              </Pressable>
            )}
          </View>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text className="text-sm font-semibold text-primary">닫기</Text>
          </Pressable>
        </View>
        <FlatList
          data={results ?? []}
          keyExtractor={(item) => String(item.player_id)}
          renderItem={({ item }) => (
            <Pressable
              className="flex-row items-center px-4 py-3 active:bg-neutral-50"
              onPress={() => {
                onSelect({
                  player_id: item.player_id,
                  name: item.name,
                  profile_image_url: item.profile_image_url ?? null,
                });
                onClose();
                setQuery('');
              }}
            >
              {item.profile_image_url ? (
                <Image
                  source={{ uri: item.profile_image_url }}
                  style={{ width: 36, height: 36, borderRadius: 18 }}
                  contentFit="cover"
                />
              ) : (
                <View className="h-9 w-9 items-center justify-center rounded-full bg-neutral-100">
                  <Text className="text-sm font-bold text-neutral-400">{item.name?.charAt(0)}</Text>
                </View>
              )}
              <Text className="ml-3 text-sm font-medium text-neutral-800">{item.name}</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            query.length >= 1 ? (
              <EmptyState title="검색 결과가 없습니다." />
            ) : (
              <EmptyState title="선수 이름을 입력하세요" />
            )
          }
        />
      </View>
    </Modal>
  );
}

/* ── 선수 선택 카드 ── */
function PlayerSlot({
  player,
  label,
  onPress,
  onClear,
}: {
  player: SelectedPlayer | null;
  label: string;
  onPress: () => void;
  onClear: () => void;
}) {
  if (!player) {
    return (
      <Pressable
        className="flex-1 items-center rounded-2xl border-2 border-dashed border-neutral-200 py-6 active:bg-neutral-50"
        onPress={onPress}
      >
        <View className="h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
          <Search size={20} color="#a3a3a3" />
        </View>
        <Text className="mt-2 text-xs font-semibold text-neutral-400">{label}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      className="flex-1 items-center rounded-2xl border border-neutral-100 bg-white py-4 active:bg-neutral-50"
      onPress={onPress}
    >
      <View style={{ position: 'relative' }}>
        {player.profile_image_url ? (
          <Image
            source={{ uri: player.profile_image_url }}
            style={{ width: 48, height: 48, borderRadius: 24 }}
            contentFit="cover"
          />
        ) : (
          <View className="h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
            <Text className="text-lg font-bold text-neutral-400">{player.name?.charAt(0)}</Text>
          </View>
        )}
        <Pressable
          className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-neutral-300"
          onPress={onClear}
          hitSlop={8}
        >
          <X size={10} color="#fff" />
        </Pressable>
      </View>
      <Text className="mt-2 text-xs font-semibold text-neutral-800" numberOfLines={1}>
        {player.name}
      </Text>
    </Pressable>
  );
}

/* ── 비교 바 ── */
function StatBar({
  label,
  value1,
  value2,
  higherIsBetter = true,
}: {
  label: string;
  value1: number;
  value2: number;
  higherIsBetter?: boolean;
}) {
  const max = Math.max(value1, value2, 1);
  const w1 = (value1 / max) * 100;
  const w2 = (value2 / max) * 100;

  const is1Better = higherIsBetter ? value1 >= value2 : value1 <= value2;
  const is2Better = higherIsBetter ? value2 >= value1 : value2 <= value1;

  return (
    <View className="py-2.5">
      <Text className="mb-1.5 text-center text-[11px] font-medium text-neutral-400">{label}</Text>
      <View className="flex-row items-center" style={{ gap: 8 }}>
        <Text
          className={`w-8 text-right text-xs font-bold ${is1Better ? 'text-primary' : 'text-neutral-400'}`}
          style={NUM}
        >
          {value1}
        </Text>
        <View className="flex-1 flex-row items-center" style={{ gap: 4 }}>
          <View className="flex-1 items-end">
            <View
              className={`h-4 rounded-l-full ${is1Better ? 'bg-primary/20' : 'bg-neutral-100'}`}
              style={{ width: `${w1}%`, minWidth: 4 }}
            />
          </View>
          <View className="flex-1">
            <View
              className={`h-4 rounded-r-full ${is2Better ? 'bg-blue-100' : 'bg-neutral-100'}`}
              style={{ width: `${w2}%`, minWidth: 4 }}
            />
          </View>
        </View>
        <Text
          className={`w-8 text-left text-xs font-bold ${is2Better ? 'text-blue-500' : 'text-neutral-400'}`}
          style={NUM}
        >
          {value2}
        </Text>
      </View>
    </View>
  );
}

/* ── 맞대결 섹션 ── */
function HeadToHeadSection({ data }: { data: CompareResponse }) {
  const { head_to_head } = data;
  if (head_to_head.total_matches === 0) return null;

  const draws = head_to_head.total_matches - head_to_head.player1_wins - head_to_head.player2_wins;

  return (
    <Card className="p-4">
      <Text className="mb-3 text-sm font-bold text-neutral-800">맞대결 전적</Text>
      <View className="flex-row items-center justify-around">
        <View className="items-center">
          <Text className="text-2xl font-bold text-primary" style={NUM}>
            {head_to_head.player1_wins}
          </Text>
          <Text className="text-[10px] text-neutral-400">승</Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl font-bold text-neutral-400" style={NUM}>
            {draws}
          </Text>
          <Text className="text-[10px] text-neutral-400">무</Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl font-bold text-blue-500" style={NUM}>
            {head_to_head.player2_wins}
          </Text>
          <Text className="text-[10px] text-neutral-400">승</Text>
        </View>
      </View>
      <Text className="mt-2 text-center text-[10px] text-neutral-400">
        총 {head_to_head.total_matches}경기
      </Text>
    </Card>
  );
}

/* ── 골 타이밍 섹션 ── */
function GoalTimingSection({ data }: { data: CompareResponse }) {
  const { goal_timing } = data;
  if (goal_timing.player1.total === 0 && goal_timing.player2.total === 0) return null;

  const renderBar = (
    gt: { first_half: number; second_half: number; total: number },
    color: string
  ) => {
    if (gt.total === 0) return <View className="h-5 flex-1 rounded-full bg-neutral-100" />;
    const fhPct = (gt.first_half / gt.total) * 100;
    return (
      <View className="h-5 flex-1 flex-row overflow-hidden rounded-full">
        <View className={color} style={{ width: `${fhPct}%` }} />
        <View className={`${color} opacity-40`} style={{ width: `${100 - fhPct}%` }} />
      </View>
    );
  };

  return (
    <Card className="p-4">
      <Text className="mb-3 text-sm font-bold text-neutral-800">골 타이밍</Text>
      <View style={{ gap: 8 }}>
        <View className="flex-row items-center" style={{ gap: 8 }}>
          <Text className="w-5 text-xs font-bold text-primary" style={NUM}>
            {goal_timing.player1.total}
          </Text>
          {renderBar(goal_timing.player1, 'bg-primary/30')}
        </View>
        <View className="flex-row items-center" style={{ gap: 8 }}>
          <Text className="w-5 text-xs font-bold text-blue-500" style={NUM}>
            {goal_timing.player2.total}
          </Text>
          {renderBar(goal_timing.player2, 'bg-blue-200')}
        </View>
      </View>
      <View className="mt-2 flex-row justify-center" style={{ gap: 12 }}>
        <View className="flex-row items-center" style={{ gap: 4 }}>
          <View className="h-2.5 w-2.5 rounded-sm bg-neutral-300" />
          <Text className="text-[10px] text-neutral-400">전반</Text>
        </View>
        <View className="flex-row items-center" style={{ gap: 4 }}>
          <View className="h-2.5 w-2.5 rounded-sm bg-neutral-200" />
          <Text className="text-[10px] text-neutral-400">후반</Text>
        </View>
      </View>
    </Card>
  );
}

/* ── 시즌별 성적 ── */
function SeasonBreakdownSection({ data }: { data: CompareResponse }) {
  if (!data.season_breakdown || data.season_breakdown.length === 0) return null;

  return (
    <Card className="p-4">
      <Text className="mb-3 text-sm font-bold text-neutral-800">시즌별 성적</Text>
      {/* 헤더 */}
      <View className="flex-row border-b border-neutral-100 pb-2">
        <View className="flex-1" />
        <View className="flex-row" style={{ gap: 2 }}>
          <Text className="w-14 text-center text-[10px] font-semibold text-primary">선수1</Text>
          <Text className="w-14 text-center text-[10px] font-semibold text-blue-500">선수2</Text>
        </View>
      </View>
      {data.season_breakdown.map((entry: SeasonBreakdownEntry) => (
        <View
          key={entry.season_id}
          className="flex-row items-center border-b border-neutral-50 py-2.5"
        >
          <Text className="flex-1 text-[11px] text-neutral-600" numberOfLines={1}>
            {sanitizeLabel(entry.season_name)}
          </Text>
          <View className="flex-row" style={{ gap: 2 }}>
            <Text className="w-14 text-center text-[11px] font-bold text-neutral-700" style={NUM}>
              {entry.player1.goals}G {entry.player1.assists}A
            </Text>
            <Text className="w-14 text-center text-[11px] font-bold text-neutral-700" style={NUM}>
              {entry.player2.goals}G {entry.player2.assists}A
            </Text>
          </View>
        </View>
      ))}
    </Card>
  );
}

/* ── 메인 페이지 ── */
export default function PlayerComparePage() {
  const { player1: player1Param } = useLocalSearchParams<{ player1?: string }>();
  const [player1, setPlayer1] = useState<SelectedPlayer | null>(null);
  const [player2, setPlayer2] = useState<SelectedPlayer | null>(null);
  const [searchTarget, setSearchTarget] = useState<1 | 2>(1);
  const [showSearch, setShowSearch] = useState(false);

  // URL에서 player1 파라미터 읽어서 자동 선택
  const { data: preselectedPlayer } = useQuery({
    queryKey: ['playerById', Number(player1Param)],
    queryFn: async () => {
      const id = Number(player1Param);
      const players = await searchPlayersByNamePrisma('');
      const found = players.find((p) => p.player_id === id);
      if (found)
        return {
          player_id: found.player_id,
          name: found.name,
          profile_image_url: found.profile_image_url ?? null,
        } as SelectedPlayer;
      return null;
    },
    enabled: !!player1Param && !player1,
  });

  useEffect(() => {
    if (preselectedPlayer && !player1) {
      setPlayer1(preselectedPlayer);
    }
  }, [preselectedPlayer, player1]);

  const openSearch = useCallback((target: 1 | 2) => {
    setSearchTarget(target);
    setShowSearch(true);
  }, []);

  const handleSelect = useCallback(
    (p: SelectedPlayer) => {
      if (searchTarget === 1) setPlayer1(p);
      else setPlayer2(p);
    },
    [searchTarget]
  );

  const bothSelected = player1 != null && player2 != null;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['playerCompare', player1?.player_id, player2?.player_id],
    queryFn: () => getPlayerCompare(player1!.player_id, player2!.player_id),
    enabled: bothSelected,
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: '선수 비교',
          headerShown: true,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <ScrollView className="flex-1 bg-neutral-50" showsVerticalScrollIndicator={false}>
        {/* 선수 선택 영역 */}
        <View className="bg-white px-4 pb-5 pt-3">
          <View className="flex-row" style={{ gap: 12 }}>
            <PlayerSlot
              player={player1}
              label="선수 1 선택"
              onPress={() => openSearch(1)}
              onClear={() => setPlayer1(null)}
            />
            <View className="items-center justify-center">
              <Text className="text-sm font-bold text-neutral-300">VS</Text>
            </View>
            <PlayerSlot
              player={player2}
              label="선수 2 선택"
              onPress={() => openSearch(2)}
              onClear={() => setPlayer2(null)}
            />
          </View>
        </View>

        {/* 비교 결과 */}
        {!bothSelected ? (
          <EmptyState
            title="두 선수를 선택해 주세요"
            description="비교하고 싶은 선수 두 명을 검색하여 선택하세요."
          />
        ) : isLoading ? (
          <LoadingSpinner />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : data ? (
          <View style={{ gap: 12 }} className="px-4 pb-10 pt-3">
            {/* 통계 비교 바 */}
            <Card className="px-4 py-2">
              <StatBar
                label="경기"
                value1={data.player1.stats.matches}
                value2={data.player2.stats.matches}
              />
              <StatBar
                label="득점"
                value1={data.player1.stats.goals}
                value2={data.player2.stats.goals}
              />
              <StatBar
                label="도움"
                value1={data.player1.stats.assists}
                value2={data.player2.stats.assists}
              />
              <StatBar
                label="공격포인트"
                value1={data.player1.stats.attack_points}
                value2={data.player2.stats.attack_points}
              />
              <StatBar
                label="선방"
                value1={data.player1.stats.saves}
                value2={data.player2.stats.saves}
              />
              <StatBar
                label="경고"
                value1={data.player1.stats.yellow_cards}
                value2={data.player2.stats.yellow_cards}
                higherIsBetter={false}
              />
              <StatBar
                label="퇴장"
                value1={data.player1.stats.red_cards}
                value2={data.player2.stats.red_cards}
                higherIsBetter={false}
              />
            </Card>

            <HeadToHeadSection data={data} />
            <GoalTimingSection data={data} />
            <SeasonBreakdownSection data={data} />
          </View>
        ) : null}
      </ScrollView>

      <PlayerSearchModal
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        onSelect={handleSelect}
      />
    </>
  );
}
