import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { ChevronDown, X } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { getAllSeasonsPrisma } from '@/api/seasons';
import { getTeamRankings, TeamRanking } from '@/api/stats';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const NUM = { fontVariant: ['tabular-nums' as const] };

/* ── 정렬 기준 옵션 ── */
const SORT_OPTIONS = [
  { value: 'win_rate', label: '승률 높은 순' },
  { value: 'goal_difference', label: '득실차 좋은 순' },
  { value: 'goals_for', label: '득점 많은 순' },
  { value: 'goals_against', label: '실점 적은 순' },
  { value: 'goals_for_per_match', label: '경기당 득점 많은 순' },
  { value: 'goals_against_per_match', label: '경기당 실점 적은 순' },
  { value: 'matches_played', label: '경기 많은 순' },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];

/* ── 순위 뱃지 ── */
function RankBadge({ rank }: { rank: number }) {
  const bg = rank <= 3 ? 'bg-amber-500/10' : 'bg-neutral-100';
  const text = rank <= 3 ? 'text-amber-600' : 'text-neutral-500';
  return (
    <View className={`h-6 w-6 items-center justify-center rounded-full ${bg}`}>
      <Text className={`text-xs font-bold ${text}`}>{rank}</Text>
    </View>
  );
}

/* ── 득실차 색상 ── */
function getGDColor(gd: number): string {
  if (gd > 0) return 'text-emerald-600';
  if (gd < 0) return 'text-red-500';
  return 'text-neutral-500';
}

/* ── 정렬 기준에 따른 주요 수치 표시 ── */
function MainStat({ team, sortBy }: { team: TeamRanking; sortBy: SortValue }) {
  switch (sortBy) {
    case 'goal_difference':
      return (
        <View className="items-end">
          <Text className={`text-base font-bold ${getGDColor(team.goal_difference)}`} style={NUM}>
            {team.goal_difference > 0 ? '+' : ''}{team.goal_difference}
          </Text>
          <Text className="text-[10px] text-neutral-400">
            {team.goals_for}득점 {team.goals_against}실점
          </Text>
        </View>
      );
    case 'goals_for':
      return (
        <View className="items-end">
          <Text className="text-base font-bold text-blue-600" style={NUM}>{team.goals_for}골</Text>
          <Text className="text-[10px] text-neutral-400">{team.matches_played}경기</Text>
        </View>
      );
    case 'goals_against':
      return (
        <View className="items-end">
          <Text className="text-base font-bold text-red-500" style={NUM}>{team.goals_against}실점</Text>
          <Text className="text-[10px] text-neutral-400">{team.matches_played}경기</Text>
        </View>
      );
    case 'goals_for_per_match':
      return (
        <View className="items-end">
          <Text className="text-base font-bold text-blue-600" style={NUM}>{team.goals_for_per_match}</Text>
          <Text className="text-[10px] text-neutral-400">{team.goals_for}골 / {team.matches_played}경기</Text>
        </View>
      );
    case 'goals_against_per_match':
      return (
        <View className="items-end">
          <Text className="text-base font-bold text-red-500" style={NUM}>{team.goals_against_per_match}</Text>
          <Text className="text-[10px] text-neutral-400">{team.goals_against}실점 / {team.matches_played}경기</Text>
        </View>
      );
    case 'matches_played':
      return (
        <View className="items-end">
          <Text className="text-base font-bold text-neutral-900" style={NUM}>{team.matches_played}경기</Text>
          <Text className="text-[10px] text-neutral-400">
            {team.wins}승 {team.draws}무 {team.losses}패
          </Text>
        </View>
      );
    default: // win_rate
      return (
        <View className="items-end">
          <Text className="text-base font-bold text-emerald-600" style={NUM}>{team.win_rate}%</Text>
          <Text className="text-[10px] text-neutral-400">
            {team.wins}승 {team.draws}무 {team.losses}패
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
      className={`flex-row items-center rounded-full px-3 py-1.5 ${active ? 'bg-amber-500/10' : 'bg-neutral-100'}`}
      onPress={onPress}
    >
      <Text className={`text-xs font-semibold ${active ? 'text-amber-600' : 'text-neutral-500'}`}>
        {label}
      </Text>
      <ChevronDown size={12} color={active ? '#d97706' : '#a3a3a3'} style={{ marginLeft: 2 }} />
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
              className={`rounded-xl px-4 py-3 ${selected === opt.value ? 'bg-amber-500/10' : ''}`}
              onPress={() => { onSelect(opt.value); onClose(); }}
            >
              <Text
                className={`text-sm ${selected === opt.value ? 'font-bold text-amber-600' : 'text-neutral-700'}`}
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

/* ── 팀 Row ── */
function TeamRow({ team, sortBy }: { team: TeamRanking; sortBy: SortValue }) {
  const router = useRouter();
  return (
    <Pressable
      className="flex-row items-center px-4 py-3.5 active:bg-neutral-50"
      onPress={() => router.push(`/teams/${team.team_id}`)}
    >
      <RankBadge rank={team.rank} />
      <View style={{ marginLeft: 8 }}>
        {team.team_logo ? (
          <Image
            source={{ uri: team.team_logo }}
            style={{ width: 36, height: 36, borderRadius: 18 }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View className="h-9 w-9 items-center justify-center rounded-full bg-neutral-100">
            <Text className="text-sm font-bold text-neutral-400">{team.team_name?.charAt(0)}</Text>
          </View>
        )}
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-sm font-semibold text-neutral-900">{team.team_name}</Text>
        <Text className="text-xs text-neutral-500">
          {team.matches_played}경기 · {team.points}점
        </Text>
      </View>
      <MainStat team={team} sortBy={sortBy} />
    </Pressable>
  );
}

/* ── 메인 페이지 ── */
export default function TeamRankingsPage() {
  const [seasonId, setSeasonId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortValue>('win_rate');
  const [showSeasonSheet, setShowSeasonSheet] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);

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
    queryKey: ['teamRankings', seasonId, sortBy],
    queryFn: () =>
      getTeamRankings({
        season_id: seasonId ?? undefined,
        limit: 50,
        sort_by: sortBy,
      }),
  });

  return (
    <>
      <Stack.Screen options={{ title: '팀 랭킹', headerShown: true, headerShadowVisible: false, headerBackButtonDisplayMode: 'minimal' }}
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
            active={sortBy !== 'win_rate'}
            onPress={() => setShowSortSheet(true)}
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
            keyExtractor={(item) => String(item.team_id)}
            renderItem={({ item }) => <TeamRow team={item} sortBy={sortBy} />}
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
    </>
  );
}
