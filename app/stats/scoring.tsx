import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { ChevronDown, X } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { getAllSeasonsPrisma } from '@/api/seasons';
import { getScoringRankings } from '@/api/stats';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { PlayerRanking } from '@/features/stats/types/scoring-rankings';
import { sanitizeLabel } from '@/lib/utils';

const NUM = { fontVariant: ['tabular-nums' as const] };

/* ── 정렬 기준 옵션 ── */
const SORT_OPTIONS = [
  { value: 'attack_points', label: '공격포인트 많은 순' },
  { value: 'goals', label: '득점 많은 순' },
  { value: 'assists', label: '도움 많은 순' },
  { value: 'attack_points_per_match', label: '경기당 공격포인트' },
  { value: 'goals_per_match', label: '경기당 득점' },
  { value: 'assists_per_match', label: '경기당 도움' },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];

/* ── 최소 경기 수 옵션 ── */
const MIN_MATCH_OPTIONS = [1, 3, 5, 10] as const;

/* ── 순위 뱃지 ── */
function RankBadge({ rank }: { rank: number }) {
  const bg = rank <= 3 ? 'bg-primary/10' : 'bg-neutral-100';
  const text = rank <= 3 ? 'text-primary' : 'text-neutral-500';
  return (
    <View className={`h-6 w-6 items-center justify-center rounded-full ${bg}`}>
      <Text className={`text-xs font-bold ${text}`}>{rank}</Text>
    </View>
  );
}

/* ── 정렬 기준에 따른 주요 수치 표시 ── */
function MainStat({ player, sortBy }: { player: PlayerRanking; sortBy: SortValue }) {
  switch (sortBy) {
    case 'goals':
      return (
        <View className="items-end">
          <Text className="text-base font-bold text-primary" style={NUM}>
            {player.goals}골
          </Text>
          <Text className="text-[10px] text-neutral-400">{player.matches_played}경기</Text>
        </View>
      );
    case 'assists':
      return (
        <View className="items-end">
          <Text className="text-base font-bold text-neutral-900" style={NUM}>
            {player.assists}도움
          </Text>
          <Text className="text-[10px] text-neutral-400">{player.matches_played}경기</Text>
        </View>
      );
    case 'goals_per_match':
      return (
        <View className="items-end">
          <Text className="text-base font-bold text-primary" style={NUM}>
            {player.goals_per_match}
          </Text>
          <Text className="text-[10px] text-neutral-400">
            {player.goals}골 / {player.matches_played}경기
          </Text>
        </View>
      );
    case 'assists_per_match':
      return (
        <View className="items-end">
          <Text className="text-base font-bold text-neutral-900" style={NUM}>
            {player.assists_per_match}
          </Text>
          <Text className="text-[10px] text-neutral-400">
            {player.assists}도움 / {player.matches_played}경기
          </Text>
        </View>
      );
    case 'attack_points_per_match':
      return (
        <View className="items-end">
          <Text className="text-base font-bold text-neutral-900" style={NUM}>
            {player.attack_points_per_match}
          </Text>
          <Text className="text-[10px] text-neutral-400">
            {player.attack_points}AP / {player.matches_played}경기
          </Text>
        </View>
      );
    default: // attack_points
      return (
        <View className="items-end">
          <Text className="text-base font-bold text-neutral-900" style={NUM}>
            {player.attack_points}
          </Text>
          <Text className="text-[10px] text-neutral-400">
            {player.goals}골 {player.assists}도움
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
      className={`flex-row items-center rounded-full px-3 py-1.5 ${active ? 'bg-primary/10' : 'bg-neutral-100'}`}
      onPress={onPress}
    >
      <Text className={`text-xs font-semibold ${active ? 'text-primary' : 'text-neutral-500'}`}>
        {label}
      </Text>
      <ChevronDown size={12} color={active ? '#ff4800' : '#a3a3a3'} style={{ marginLeft: 2 }} />
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
              className={`rounded-xl px-4 py-3 ${selected === opt.value ? 'bg-primary/10' : ''}`}
              onPress={() => {
                onSelect(opt.value);
                onClose();
              }}
            >
              <Text
                className={`text-sm ${selected === opt.value ? 'font-bold text-primary' : 'text-neutral-700'}`}
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

/* ── 선수 Row ── */
function PlayerRow({ player, sortBy }: { player: PlayerRanking; sortBy: SortValue }) {
  const router = useRouter();
  return (
    <Pressable
      className="flex-row items-center px-4 py-3.5 active:bg-neutral-50"
      onPress={() => router.push(`/players/${player.player_id}`)}
    >
      <RankBadge rank={player.rank} />
      <View style={{ position: 'relative', marginLeft: 8 }}>
        {player.player_image ? (
          <Image
            source={{ uri: player.player_image }}
            style={{ width: 36, height: 36, borderRadius: 18 }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View className="h-9 w-9 items-center justify-center rounded-full bg-neutral-100">
            <Text className="text-sm font-bold text-neutral-400">
              {player.player_name?.charAt(0)}
            </Text>
          </View>
        )}
        {player.team_logos && player.team_logos.length > 0 && (
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
              source={{ uri: player.team_logos[0] }}
              style={{ width: 15, height: 15, borderRadius: 7.5 }}
              contentFit="cover"
            />
          </View>
        )}
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-sm font-semibold text-neutral-900">{player.player_name}</Text>
        <Text className="text-xs text-neutral-500">{player.first_team_name ?? player.teams}</Text>
      </View>
      <MainStat player={player} sortBy={sortBy} />
    </Pressable>
  );
}

/* ── 메인 페이지 ── */
export default function ScoringPage() {
  const [seasonId, setSeasonId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortValue>('attack_points');
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
    ? sanitizeLabel(seasons?.find((s) => s.season_id === seasonId)?.season_name) || '시즌'
    : '전체 시즌';
  const sortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? '정렬';

  const seasonOptions = [
    { value: 0 as number, label: '전체 시즌' },
    ...(seasons?.map((s) => ({ value: s.season_id, label: sanitizeLabel(s.season_name) })) ?? []),
  ];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['scoringRankings', seasonId, sortBy, minMatches],
    queryFn: () =>
      getScoringRankings({
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
          title: '득점 랭킹',
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
            active={sortBy !== 'attack_points'}
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
            renderItem={({ item }) => <PlayerRow player={item} sortBy={sortBy} />}
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
