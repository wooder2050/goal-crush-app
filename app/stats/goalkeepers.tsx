import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { ChevronDown, X } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { getAllSeasonsPrisma } from '@/api/seasons';
import { getGoalkeeperRankings, GoalkeeperRanking } from '@/api/stats';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const NUM = { fontVariant: ['tabular-nums' as const] };

/* ── 정렬 기준 옵션 ── */
const SORT_OPTIONS = [
  { value: 'goals_conceded_per_match', label: '경기당 실점 낮은 순' },
  { value: 'clean_sheet_percentage', label: '클린시트율 높은 순' },
  { value: 'clean_sheets', label: '클린시트 많은 순' },
  { value: 'matches_played', label: '출전경기 많은 순' },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];

/* ── 최소 경기 수 옵션 ── */
const MIN_MATCH_OPTIONS = [1, 3, 5, 10] as const;

/* ── 순위 뱃지 ── */
function RankBadge({ rank }: { rank: number }) {
  const bg = rank <= 3 ? 'bg-blue-500/10' : 'bg-neutral-100';
  const text = rank <= 3 ? 'text-blue-600' : 'text-neutral-500';
  return (
    <View className={`h-6 w-6 items-center justify-center rounded-full ${bg}`}>
      <Text className={`text-xs font-bold ${text}`}>{rank}</Text>
    </View>
  );
}

/* ── 경기당 실점 색상 ── */
function getGCColor(val: string): string {
  const n = parseFloat(val);
  if (n < 1) return 'text-emerald-600';
  if (n < 2) return 'text-amber-500';
  return 'text-red-500';
}

/* ── 클린시트율 색상 ── */
function getCSColor(val: string): string {
  const n = parseFloat(val);
  if (n >= 50) return 'text-emerald-600';
  if (n >= 30) return 'text-amber-500';
  return 'text-red-500';
}

/* ── 정렬 기준에 따른 주요 수치 표시 ── */
function MainStat({ gk, sortBy }: { gk: GoalkeeperRanking; sortBy: SortValue }) {
  switch (sortBy) {
    case 'clean_sheet_percentage':
      return (
        <View className="items-end">
          <Text
            className={`text-base font-bold ${getCSColor(gk.clean_sheet_percentage)}`}
            style={NUM}
          >
            {gk.clean_sheet_percentage}%
          </Text>
          <Text className="text-[10px] text-neutral-400">
            CS {gk.clean_sheets} / {gk.matches_played}경기
          </Text>
        </View>
      );
    case 'clean_sheets':
      return (
        <View className="items-end">
          <Text className="text-base font-bold text-emerald-600" style={NUM}>
            {gk.clean_sheets}CS
          </Text>
          <Text className="text-[10px] text-neutral-400">{gk.matches_played}경기</Text>
        </View>
      );
    case 'matches_played':
      return (
        <View className="items-end">
          <Text className="text-base font-bold text-neutral-900" style={NUM}>
            {gk.matches_played}경기
          </Text>
          <Text className="text-[10px] text-neutral-400">
            실점 {gk.goals_conceded} · CS {gk.clean_sheets}
          </Text>
        </View>
      );
    default: // goals_conceded_per_match
      return (
        <View className="items-end">
          <Text
            className={`text-base font-bold ${getGCColor(gk.goals_conceded_per_match)}`}
            style={NUM}
          >
            {gk.goals_conceded_per_match}
          </Text>
          <Text className="text-[10px] text-neutral-400">
            실점 {gk.goals_conceded} / {gk.matches_played}경기
          </Text>
        </View>
      );
  }
}

/* ── 필터 칩 ── */
function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={`flex-row items-center rounded-full px-3 py-1.5 ${active ? 'bg-blue-500/10' : 'bg-neutral-100'}`}
      onPress={onPress}
    >
      <Text className={`text-xs font-semibold ${active ? 'text-blue-600' : 'text-neutral-500'}`}>
        {label}
      </Text>
      <ChevronDown size={12} color={active ? '#2563eb' : '#a3a3a3'} style={{ marginLeft: 2 }} />
    </Pressable>
  );
}

/* ── 바텀시트 (Modal) ── */
function FilterSheet<T extends string | number>({
  visible,
  onClose,
  title,
  options,
  selected,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (v: T) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <View className="rounded-t-3xl bg-white px-5 pb-10 pt-4" style={{ maxHeight: '50%' }}>
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-base font-bold text-neutral-800">{title}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <X size={20} color="#737373" />
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {options.map((opt) => (
            <Pressable
              key={String(opt.value)}
              className={`rounded-xl px-4 py-3 ${selected === opt.value ? 'bg-blue-500/10' : ''}`}
              onPress={() => {
                onSelect(opt.value);
                onClose();
              }}
            >
              <Text
                className={`text-sm ${selected === opt.value ? 'font-bold text-blue-600' : 'text-neutral-700'}`}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ── 골키퍼 Row ── */
function GKRow({ gk, sortBy }: { gk: GoalkeeperRanking; sortBy: SortValue }) {
  const router = useRouter();
  return (
    <Pressable
      className="flex-row items-center px-4 py-3.5 active:bg-neutral-50"
      onPress={() => router.push(`/players/${gk.player_id}`)}
    >
      <RankBadge rank={gk.rank} />
      <View style={{ position: 'relative', marginLeft: 8 }}>
        {gk.player_image ? (
          <Image
            source={{ uri: gk.player_image }}
            style={{ width: 36, height: 36, borderRadius: 18 }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View className="h-9 w-9 items-center justify-center rounded-full bg-neutral-100">
            <Text className="text-sm font-bold text-neutral-400">{gk.player_name?.charAt(0)}</Text>
          </View>
        )}
        {gk.team_logos && gk.team_logos.length > 0 && (
          <View
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: '#fff',
              padding: 1.5,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 1,
              elevation: 2,
            }}
          >
            <Image
              source={{ uri: gk.team_logos[0] }}
              style={{ width: 15, height: 15, borderRadius: 7.5 }}
              contentFit="cover"
            />
          </View>
        )}
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-sm font-semibold text-neutral-900">{gk.player_name}</Text>
        <Text className="text-xs text-neutral-500">{gk.team_name ?? gk.teams}</Text>
      </View>
      <MainStat gk={gk} sortBy={sortBy} />
    </Pressable>
  );
}

/* ── 메인 페이지 ── */
export default function GoalkeepersPage() {
  const [seasonId, setSeasonId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortValue>('goals_conceded_per_match');
  const [minMatches, setMinMatches] = useState(3);
  const [showSeasonSheet, setShowSeasonSheet] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [showMinMatchSheet, setShowMinMatchSheet] = useState(false);

  const { data: seasons } = useQuery({
    queryKey: ['allSeasons'],
    queryFn: getAllSeasonsPrisma,
    staleTime: 10 * 60 * 1000,
  });

  const seasonLabel = seasonId
    ? (seasons?.find((s) => s.season_id === seasonId)?.season_name ?? '시즌')
    : '전체 시즌';
  const sortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? '정렬';

  const seasonOptions = [
    { value: 0 as number, label: '전체 시즌' },
    ...(seasons?.map((s) => ({ value: s.season_id, label: s.season_name })) ?? []),
  ];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['goalkeeperRankings', seasonId, sortBy, minMatches],
    queryFn: () =>
      getGoalkeeperRankings({
        season_id: seasonId ?? undefined,
        limit: 50,
        sort_by: sortBy,
        min_matches: minMatches,
      }),
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: '골키퍼 랭킹',
          headerShown: true,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <View className="flex-1 bg-neutral-50">
        {/* 필터 */}
        <View className="flex-row flex-wrap bg-white px-4 pb-3 pt-2" style={{ gap: 8 }}>
          <FilterChip
            label={seasonLabel}
            active={seasonId !== null}
            onPress={() => setShowSeasonSheet(true)}
          />
          <FilterChip
            label={sortLabel}
            active={sortBy !== 'goals_conceded_per_match'}
            onPress={() => setShowSortSheet(true)}
          />
          <FilterChip
            label={`최소 ${minMatches}경기`}
            active={minMatches !== 3}
            onPress={() => setShowMinMatchSheet(true)}
          />
        </View>

        {/* 목록 */}
        {isLoading ? (
          <LoadingSpinner />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <FlatList
            data={data?.rankings ?? []}
            keyExtractor={(item) => String(item.player_id)}
            renderItem={({ item }) => <GKRow gk={item} sortBy={sortBy} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
            ListEmptyComponent={<EmptyState title="데이터가 없습니다." />}
          />
        )}
      </View>

      {/* 시즌 바텀시트 */}
      <FilterSheet
        visible={showSeasonSheet}
        onClose={() => setShowSeasonSheet(false)}
        title="시즌"
        options={seasonOptions}
        selected={seasonId ?? 0}
        onSelect={(v) => setSeasonId(v === 0 ? null : v)}
      />

      {/* 정렬 바텀시트 */}
      <FilterSheet
        visible={showSortSheet}
        onClose={() => setShowSortSheet(false)}
        title="정렬 기준"
        options={SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        selected={sortBy}
        onSelect={setSortBy}
      />

      {/* 최소 경기 바텀시트 */}
      <FilterSheet
        visible={showMinMatchSheet}
        onClose={() => setShowMinMatchSheet(false)}
        title="최소 경기 수"
        options={MIN_MATCH_OPTIONS.map((n) => ({ value: n, label: `${n}경기` }))}
        selected={minMatches}
        onSelect={setMinMatches}
      />
    </>
  );
}
