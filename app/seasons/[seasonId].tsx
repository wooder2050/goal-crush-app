import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from 'react-native';

import {
  getMatchesBySeasonIdPrisma,
  getSeasonMatchesPagePrisma,
  getSeasonSummaryBySeasonIdPrisma,
} from '@/api/matches';
import { getSeasonByIdPrisma } from '@/api/seasons';
import {
  getGroupLeagueStandingsPrisma,
  getStandingsWithTeamPrisma,
  getTopAppearancesPrisma,
  getTopAssistsPrisma,
  getTopRatingsPrisma,
  getTopScorersPrisma,
  getTopXtRatingsPrisma,
  TopRatedPlayerRow,
} from '@/api/stats';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TeamLogo } from '@/components/TeamLogo';
import { MatchWithTeams, PlayerSeasonStatsWithNames } from '@/lib/types';

const NUM = { fontVariant: ['tabular-nums' as const] };

type PageTab = 'matches' | 'standings' | 'players';

/* ────────────────────────────────────────────
 *  시즌 요약 카드
 * ──────────────────────────────────────────── */
interface SeasonSummary {
  total_matches: number;
  participating_teams: number;
  completed_matches: number;
  penalty_matches: number;
}

function SummaryCard({ summary }: { summary: SeasonSummary }) {
  const items: { value: number; label: string; color: string }[] = [
    { value: summary.total_matches, label: '총 경기', color: 'text-neutral-900' },
    { value: summary.participating_teams, label: '참여 팀', color: 'text-primary' },
    { value: summary.completed_matches, label: '완료', color: 'text-emerald-600' },
    { value: summary.penalty_matches, label: '승부차기', color: 'text-amber-500' },
  ];

  return (
    <View className="mx-4 mb-3 flex-row rounded-2xl bg-white p-3" style={{ gap: 1 }}>
      {items.map((item) => (
        <View key={item.label} className="flex-1 items-center">
          <Text className={`text-[22px] font-bold ${item.color}`} style={NUM}>
            {item.value}
          </Text>
          <Text className="mt-0.5 text-[11px] font-medium text-neutral-400">{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

/* ────────────────────────────────────────────
 *  페이지 탭 바
 * ──────────────────────────────────────────── */
function PageTabBar({
  tabs,
  activeTab,
  onSelect,
}: {
  tabs: { key: PageTab; label: string }[];
  activeTab: PageTab;
  onSelect: (tab: PageTab) => void;
}) {
  return (
    <View className="flex-row bg-white px-4">
      {tabs.map((t) => {
        const active = activeTab === t.key;
        return (
          <Pressable
            key={t.key}
            className={`mr-5 pb-3 pt-2.5 ${active ? 'border-b-[2.5px] border-primary' : 'border-b-[2.5px] border-transparent'}`}
            onPress={() => onSelect(t.key)}
          >
            <Text
              className={`text-[13px] font-bold ${active ? 'text-neutral-900' : 'text-neutral-400'}`}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ────────────────────────────────────────────
 *  세그먼트 컨트롤 (공용)
 * ──────────────────────────────────────────── */
function SegmentedControl<T extends string>({
  tabs,
  activeTab,
  onSelect,
  scrollable,
}: {
  tabs: { key: T; label: string }[];
  activeTab: T;
  onSelect: (tab: T) => void;
  scrollable?: boolean;
}) {
  const content = (
    <View className="flex-row rounded-xl bg-neutral-100 p-1" style={{ gap: 4 }}>
      {tabs.map((t) => {
        const active = activeTab === t.key;
        return (
          <Pressable
            key={t.key}
            className={`items-center rounded-lg px-3 py-[7px] ${scrollable ? '' : 'flex-1'} ${active ? 'bg-white' : ''}`}
            style={
              active
                ? {
                    shadowColor: '#000',
                    shadowOpacity: 0.06,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 1 },
                    elevation: 2,
                  }
                : undefined
            }
            onPress={() => onSelect(t.key)}
          >
            <Text
              className={`text-[12px] font-semibold ${active ? 'text-neutral-900' : 'text-neutral-400'}`}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {content}
      </ScrollView>
    );
  }

  return <View className="px-4">{content}</View>;
}

/* ────────────────────────────────────────────
 *  경기 결과 탭
 * ──────────────────────────────────────────── */
function CompactMatchRow({ match, onPress }: { match: MatchWithTeams; onPress: () => void }) {
  const isCompleted = match.status === 'completed';
  const hasPenalty = match.penalty_home_score != null && match.penalty_away_score != null;

  const homeWin =
    isCompleted &&
    match.home_score != null &&
    match.away_score != null &&
    match.home_score > match.away_score;
  const awayWin =
    isCompleted &&
    match.home_score != null &&
    match.away_score != null &&
    match.away_score > match.home_score;

  return (
    <Pressable className="flex-row items-center py-3 active:bg-neutral-50" onPress={onPress}>
      {/* 날짜 */}
      <Text className="w-12 text-center text-[11px] font-medium text-neutral-400" style={NUM}>
        {match.match_date ? format(new Date(match.match_date), 'MM/dd') : '-'}
      </Text>

      {/* 홈팀 */}
      <View className="min-w-0 flex-1 flex-row items-center justify-end">
        <Text
          className={`mr-2 shrink text-[13px] ${homeWin ? 'font-bold text-neutral-900' : 'font-medium text-neutral-500'}`}
          numberOfLines={1}
        >
          {match.home_team?.team_name}
        </Text>
        <TeamLogo uri={match.home_team?.logo} size={22} teamName={match.home_team?.team_name} />
      </View>

      {/* 스코어 */}
      <View className="mx-2.5 w-14 items-center">
        {isCompleted ? (
          <>
            <Text className="text-[13px] font-bold text-neutral-900" style={NUM}>
              {match.home_score} - {match.away_score}
            </Text>
            {hasPenalty && (
              <Text className="mt-0.5 text-[10px] font-medium text-neutral-400" style={NUM}>
                PK {match.penalty_home_score}-{match.penalty_away_score}
              </Text>
            )}
          </>
        ) : (
          <View className="rounded-md bg-neutral-100 px-2 py-0.5">
            <Text className="text-[10px] font-medium text-neutral-400">
              {match.match_date ? format(new Date(match.match_date), 'HH:mm') : 'vs'}
            </Text>
          </View>
        )}
      </View>

      {/* 원정팀 */}
      <View className="min-w-0 flex-1 flex-row items-center">
        <TeamLogo uri={match.away_team?.logo} size={22} teamName={match.away_team?.team_name} />
        <Text
          className={`ml-2 shrink text-[13px] ${awayWin ? 'font-bold text-neutral-900' : 'font-medium text-neutral-500'}`}
          numberOfLines={1}
        >
          {match.away_team?.team_name}
        </Text>
      </View>
    </Pressable>
  );
}

function MatchDivider() {
  return <View className="ml-12 h-px bg-neutral-100" />;
}

function MatchesTab({ seasonId }: { seasonId: number }) {
  const router = useRouter();
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['seasonMatches', seasonId],
      queryFn: ({ pageParam }) => getSeasonMatchesPagePrisma(seasonId, pageParam as number, 20),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextPage,
    });

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const matches = data?.pages.flatMap((p) => p.items) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  return (
    <FlatList
      data={matches}
      keyExtractor={(item) => String(item.match_id)}
      renderItem={({ item }) => (
        <CompactMatchRow match={item} onPress={() => router.push(`/matches/${item.match_id}`)} />
      )}
      ItemSeparatorComponent={MatchDivider}
      contentContainerStyle={{ paddingBottom: 32 }}
      onEndReached={() => hasNextPage && fetchNextPage()}
      onEndReachedThreshold={0.5}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        totalCount > 0 ? (
          <View className="mx-4 mb-1 mt-4 flex-row items-center">
            <View className="mr-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
            <Text className="text-xs font-semibold text-neutral-500">총 {totalCount}경기</Text>
          </View>
        ) : null
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <View className="py-4">
            <ActivityIndicator size="small" color="#ff4800" />
          </View>
        ) : null
      }
      ListEmptyComponent={<EmptyState title="경기 기록이 없습니다" />}
    />
  );
}

/* ────────────────────────────────────────────
 *  팀 순위 탭
 * ──────────────────────────────────────────── */
interface StandingRow {
  standing_id: number;
  position: number;
  matches_played: number | null;
  wins: number | null;
  draws: number | null;
  losses: number | null;
  goals_for: number | null;
  goals_against: number | null;
  goal_difference: number | null;
  points: number | null;
  form: string | null;
  team?: { team_id: number; team_name: string; logo: string | null } | null;
}

const COL = {
  rank: 'w-7',
  logo: 'w-6',
  mp: 'w-7',
  w: 'w-7',
  l: 'w-7',
  gf: 'w-7',
  ga: 'w-7',
  gd: 'w-8',
  pts: 'w-8',
  form: 'w-[56px]',
} as const;

function FormCircle({ result }: { result: string }) {
  const bg = result === 'W' ? 'bg-emerald-500' : result === 'L' ? 'bg-red-400' : 'bg-neutral-300';
  return (
    <View className={`h-[15px] w-[15px] items-center justify-center rounded-full ${bg}`}>
      <Text className="text-[8px] font-bold text-white">{result}</Text>
    </View>
  );
}

function StandingsTable({ standings, label }: { standings: StandingRow[]; label?: string }) {
  const router = useRouter();

  if (!standings || standings.length === 0) {
    return <EmptyState title="순위 데이터가 없습니다" />;
  }

  return (
    <View className="mx-4 rounded-2xl bg-white p-3">
      {label && (
        <View className="mb-2 flex-row items-center">
          <View className="mr-1.5 h-3 w-3 rounded bg-primary/10" />
          <Text className="text-xs font-bold text-neutral-500">{label}</Text>
        </View>
      )}

      {/* 헤더 */}
      <View className="flex-row items-center pb-2.5 pt-1">
        <View className={COL.rank} />
        <View className={`${COL.logo} ml-0.5`} />
        <Text className="ml-1.5 flex-1 text-[10px] font-semibold text-neutral-400">팀</Text>
        <Text className={`${COL.mp} text-center text-[10px] font-semibold text-neutral-400`}>
          경기
        </Text>
        <Text className={`${COL.w} text-center text-[10px] font-semibold text-neutral-400`}>
          승
        </Text>
        <Text className={`${COL.l} text-center text-[10px] font-semibold text-neutral-400`}>
          패
        </Text>
        <Text className={`${COL.gf} text-center text-[10px] font-semibold text-neutral-400`}>
          득
        </Text>
        <Text className={`${COL.ga} text-center text-[10px] font-semibold text-neutral-400`}>
          실
        </Text>
        <Text className={`${COL.gd} text-center text-[10px] font-semibold text-neutral-400`}>
          득실
        </Text>
        <Text className={`${COL.pts} text-center text-[10px] font-semibold text-neutral-400`}>
          승점
        </Text>
        <Text className={`${COL.form} text-right text-[10px] font-semibold text-neutral-400`}>
          최근
        </Text>
      </View>
      <View className="h-px bg-neutral-100" />

      {standings.map((s, idx) => {
        const isTopTwo = s.position <= 2;
        const isLast = idx === standings.length - 1;
        return (
          <Pressable
            key={s.standing_id ?? `${s.position}-${s.team?.team_id}`}
            className={`flex-row items-center py-2.5 active:bg-neutral-50 ${!isLast ? 'border-b border-neutral-50' : ''}`}
            onPress={() => {
              if (s.team?.team_id != null) router.push(`/teams/${s.team.team_id}`);
            }}
          >
            <View className={`${COL.rank} items-center justify-center`}>
              {isTopTwo ? (
                <View className="h-[22px] w-[22px] items-center justify-center rounded-full bg-primary/10">
                  <Text className="text-[11px] font-bold text-primary">{s.position}</Text>
                </View>
              ) : (
                <Text className="text-[11px] font-semibold text-neutral-400">{s.position}</Text>
              )}
            </View>
            <View className={`${COL.logo} ml-0.5 items-center`}>
              <TeamLogo uri={s.team?.logo} size={22} teamName={s.team?.team_name} />
            </View>
            <Text
              className="ml-1.5 flex-1 text-[12px] font-semibold text-neutral-800"
              numberOfLines={1}
            >
              {s.team?.team_name}
            </Text>
            <Text
              className={`${COL.mp} text-center text-[11px] font-medium text-neutral-500`}
              style={NUM}
            >
              {s.matches_played ?? 0}
            </Text>
            <Text
              className={`${COL.w} text-center text-[11px] font-semibold text-emerald-600`}
              style={NUM}
            >
              {s.wins ?? 0}
            </Text>
            <Text
              className={`${COL.l} text-center text-[11px] font-semibold text-red-400`}
              style={NUM}
            >
              {s.losses ?? 0}
            </Text>
            <Text
              className={`${COL.gf} text-center text-[11px] font-medium text-neutral-500`}
              style={NUM}
            >
              {s.goals_for ?? 0}
            </Text>
            <Text
              className={`${COL.ga} text-center text-[11px] font-medium text-neutral-500`}
              style={NUM}
            >
              {s.goals_against ?? 0}
            </Text>
            <Text
              className={`${COL.gd} text-center text-[11px] font-medium text-neutral-400`}
              style={NUM}
            >
              {(s.goal_difference ?? 0) > 0 ? '+' : ''}
              {s.goal_difference ?? 0}
            </Text>
            <Text
              className={`${COL.pts} text-center text-[12px] font-bold text-neutral-900`}
              style={NUM}
            >
              {s.points ?? 0}
            </Text>
            <View className={`${COL.form} flex-row items-center justify-end gap-0.5`}>
              {(s.form ? s.form.split('') : []).slice(-3).map((r, i) => (
                <FormCircle key={i} result={r} />
              ))}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

type StandingsSubTab = 'all' | 'A' | 'B';

function buildFormMap(matches: MatchWithTeams[]): Map<number, string> {
  const completed = matches
    .filter((m) => m.status === 'completed')
    .sort((a, b) => new Date(b.match_date ?? 0).getTime() - new Date(a.match_date ?? 0).getTime());

  const formMap = new Map<number, string>();
  const teamIds = new Set<number>();
  for (const m of completed) {
    if (m.home_team_id != null) teamIds.add(m.home_team_id);
    if (m.away_team_id != null) teamIds.add(m.away_team_id);
  }

  for (const teamId of teamIds) {
    const teamMatches = completed
      .filter((m) => m.home_team_id === teamId || m.away_team_id === teamId)
      .slice(0, 3);

    const form = teamMatches
      .map((m) => {
        const isHome = m.home_team_id === teamId;
        const ts = isHome ? m.home_score : m.away_score;
        const os = isHome ? m.away_score : m.home_score;
        if (ts == null || os == null) return '';
        if (ts !== os) return ts > os ? 'W' : 'L';
        const tpk = isHome ? m.penalty_home_score : m.penalty_away_score;
        const opk = isHome ? m.penalty_away_score : m.penalty_home_score;
        if (tpk != null && opk != null) return tpk > opk ? 'W' : 'L';
        return 'W';
      })
      .join('');

    if (form) formMap.set(teamId, form);
  }

  return formMap;
}

function applyForm(standings: StandingRow[], formMap: Map<number, string>): StandingRow[] {
  return standings.map((s) => ({
    ...s,
    form: s.team?.team_id != null ? (formMap.get(s.team.team_id) ?? null) : null,
  }));
}

function StandingsTab({ seasonId, isGLeague }: { seasonId: number; isGLeague: boolean }) {
  const [subTab, setSubTab] = useState<StandingsSubTab>('all');

  const { data: allMatches } = useQuery({
    queryKey: ['seasonAllMatches', seasonId],
    queryFn: () => getMatchesBySeasonIdPrisma(seasonId),
  });

  const formMap = allMatches ? buildFormMap(allMatches) : new Map<number, string>();

  const { data: rawOverall, isLoading: overallLoading } = useQuery({
    queryKey: ['standingsWithTeam', seasonId],
    queryFn: () => getStandingsWithTeamPrisma(seasonId) as Promise<StandingRow[]>,
  });

  const { data: rawGroupA, isLoading: groupALoading } = useQuery({
    queryKey: ['groupLeagueStandings', seasonId, 'group_stage', 'A'],
    queryFn: () =>
      getGroupLeagueStandingsPrisma(seasonId, 'group_stage', 'A') as Promise<StandingRow[]>,
    enabled: isGLeague,
  });

  const { data: rawGroupB, isLoading: groupBLoading } = useQuery({
    queryKey: ['groupLeagueStandings', seasonId, 'group_stage', 'B'],
    queryFn: () =>
      getGroupLeagueStandingsPrisma(seasonId, 'group_stage', 'B') as Promise<StandingRow[]>,
    enabled: isGLeague,
  });

  const overallStandings = rawOverall ? applyForm(rawOverall, formMap) : [];
  const groupAStandings = rawGroupA ? applyForm(rawGroupA, formMap) : [];
  const groupBStandings = rawGroupB ? applyForm(rawGroupB, formMap) : [];

  const isLoading = overallLoading || (isGLeague && (groupALoading || groupBLoading));
  if (isLoading) return <LoadingSpinner />;

  const subTabs: { key: StandingsSubTab; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'A', label: 'A조' },
    { key: 'B', label: 'B조' },
  ];

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {isGLeague && (
        <View className="mb-4">
          <SegmentedControl tabs={subTabs} activeTab={subTab} onSelect={setSubTab} />
        </View>
      )}
      {subTab === 'all' && <StandingsTable standings={overallStandings} />}
      {subTab === 'A' && <StandingsTable standings={groupAStandings} />}
      {subTab === 'B' && <StandingsTable standings={groupBStandings} />}
    </ScrollView>
  );
}

/* ────────────────────────────────────────────
 *  개인 순위 탭
 * ──────────────────────────────────────────── */
type PlayerSubTab = 'rating' | 'xtRating' | 'goals' | 'assists' | 'appearances';

function getRatingColor(rating: number): string {
  if (rating >= 9.0) return '#14A0FF';
  if (rating >= 7.0) return '#33C771';
  return '#FF963F';
}

function PlayerRankRow({
  rank,
  name,
  teamName,
  playerImage,
  value,
  subLabel,
  isRating,
  onPress,
}: {
  rank: number;
  name: string | null;
  teamName: string | null;
  playerImage: string | null;
  value: string;
  subLabel?: string;
  isRating?: boolean;
  onPress: () => void;
}) {
  const isTopThree = rank <= 3;

  return (
    <Pressable className="flex-row items-center py-2.5 active:bg-neutral-50" onPress={onPress}>
      {/* 순위 */}
      <View className="w-8 items-center">
        {isTopThree ? (
          <View className="h-[22px] w-[22px] items-center justify-center rounded-full bg-primary/10">
            <Text className="text-[11px] font-bold text-primary">{rank}</Text>
          </View>
        ) : (
          <Text className="text-[11px] font-semibold text-neutral-400">{rank}</Text>
        )}
      </View>

      {/* 프로필 */}
      {playerImage ? (
        <Image
          source={{ uri: playerImage }}
          style={{ width: 36, height: 36, borderRadius: 18, marginLeft: 4 }}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View
          className="ml-1 items-center justify-center rounded-full bg-neutral-100"
          style={{ width: 36, height: 36 }}
        >
          <Text className="text-xs font-bold text-neutral-400">{name?.charAt(0)}</Text>
        </View>
      )}

      {/* 이름 & 팀 */}
      <View className="ml-2.5 min-w-0 flex-1">
        <Text className="text-[13px] font-semibold text-neutral-800" numberOfLines={1}>
          {name}
        </Text>
        <Text className="mt-0.5 text-[11px] text-neutral-400" numberOfLines={1}>
          {teamName}
        </Text>
      </View>

      {/* 수치 */}
      <View className="items-end">
        {isRating ? (
          <View
            className="items-center justify-center rounded-lg px-2 py-1"
            style={{ backgroundColor: getRatingColor(parseFloat(value)) }}
          >
            <Text className="text-[13px] font-bold text-white" style={NUM}>
              {value}
            </Text>
          </View>
        ) : (
          <Text className="text-[15px] font-bold text-neutral-900" style={NUM}>
            {value}
          </Text>
        )}
        {subLabel && <Text className="mt-0.5 text-[10px] text-neutral-400">{subLabel}</Text>}
      </View>
    </Pressable>
  );
}

function PlayersTab({ seasonId }: { seasonId: number }) {
  const router = useRouter();
  const [subTab, setSubTab] = useState<PlayerSubTab>('goals');

  const { data: scorers, isLoading: scorersLoading } = useQuery({
    queryKey: ['topScorers', seasonId],
    queryFn: () => getTopScorersPrisma(seasonId, 20),
  });

  const { data: assists, isLoading: assistsLoading } = useQuery({
    queryKey: ['topAssists', seasonId],
    queryFn: () => getTopAssistsPrisma(seasonId, 20),
  });

  const { data: appearances, isLoading: appearancesLoading } = useQuery({
    queryKey: ['topAppearances', seasonId],
    queryFn: () => getTopAppearancesPrisma(seasonId, 20),
  });

  const { data: ratings, isLoading: ratingsLoading } = useQuery({
    queryKey: ['topRatings', seasonId],
    queryFn: () => getTopRatingsPrisma(seasonId, 20),
  });

  const { data: xtRatings, isLoading: xtRatingsLoading } = useQuery({
    queryKey: ['topXtRatings', seasonId],
    queryFn: () => getTopXtRatingsPrisma(seasonId, 20),
  });

  const isLoading =
    scorersLoading || assistsLoading || appearancesLoading || ratingsLoading || xtRatingsLoading;
  if (isLoading) return <LoadingSpinner />;

  const subTabs: { key: PlayerSubTab; label: string }[] = [
    ...(ratings && ratings.length > 0 ? [{ key: 'rating' as const, label: '스탯평점' }] : []),
    ...(xtRatings && xtRatings.length > 0 ? [{ key: 'xtRating' as const, label: 'xT평점' }] : []),
    { key: 'goals' as const, label: '득점' },
    { key: 'assists' as const, label: '도움' },
    { key: 'appearances' as const, label: '출전' },
  ];

  const renderList = () => {
    if (subTab === 'rating' && ratings) {
      return ratings.map((p: TopRatedPlayerRow, i: number) => (
        <PlayerRankRow
          key={p.player_id}
          rank={i + 1}
          name={p.player_name}
          teamName={p.team_name}
          playerImage={p.player_image}
          value={p.avg_rating.toFixed(1)}
          subLabel={`${p.matches_rated}경기`}
          isRating
          onPress={() => router.push(`/players/${p.player_id}`)}
        />
      ));
    }

    if (subTab === 'xtRating' && xtRatings) {
      return xtRatings.map((p: TopRatedPlayerRow, i: number) => (
        <PlayerRankRow
          key={p.player_id}
          rank={i + 1}
          name={p.player_name}
          teamName={p.team_name}
          playerImage={p.player_image}
          value={p.avg_rating.toFixed(1)}
          subLabel={`${p.matches_rated}경기`}
          isRating
          onPress={() => router.push(`/players/${p.player_id}`)}
        />
      ));
    }

    if (subTab === 'goals' && scorers) {
      return scorers.map((p: PlayerSeasonStatsWithNames, i: number) => (
        <PlayerRankRow
          key={p.stat_id}
          rank={i + 1}
          name={p.player_name}
          teamName={p.team_name}
          playerImage={p.player_image ?? null}
          value={String(p.goals ?? 0)}
          subLabel={`${p.matches_played ?? 0}경기`}
          onPress={() => {
            if (p.player_id != null) router.push(`/players/${p.player_id}`);
          }}
        />
      ));
    }

    if (subTab === 'assists' && assists) {
      return assists.map((p: PlayerSeasonStatsWithNames, i: number) => (
        <PlayerRankRow
          key={p.stat_id}
          rank={i + 1}
          name={p.player_name}
          teamName={p.team_name}
          playerImage={p.player_image ?? null}
          value={String(p.assists ?? 0)}
          subLabel={`${p.matches_played ?? 0}경기`}
          onPress={() => {
            if (p.player_id != null) router.push(`/players/${p.player_id}`);
          }}
        />
      ));
    }

    if (subTab === 'appearances' && appearances) {
      return appearances.map((p: PlayerSeasonStatsWithNames, i: number) => (
        <PlayerRankRow
          key={p.stat_id}
          rank={i + 1}
          name={p.player_name}
          teamName={p.team_name}
          playerImage={p.player_image ?? null}
          value={String(p.matches_played ?? 0)}
          onPress={() => {
            if (p.player_id != null) router.push(`/players/${p.player_id}`);
          }}
        />
      ));
    }

    return <EmptyState title="데이터가 없습니다" />;
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="mb-4">
        <SegmentedControl tabs={subTabs} activeTab={subTab} onSelect={setSubTab} scrollable />
      </View>

      <View className="mx-4 rounded-2xl bg-white px-3 py-1">{renderList()}</View>
    </ScrollView>
  );
}

/* ────────────────────────────────────────────
 *  메인 화면
 * ──────────────────────────────────────────── */
export default function SeasonDetailScreen() {
  const { seasonId, tab } = useLocalSearchParams<{ seasonId: string; tab?: string }>();
  const id = Number(seasonId);
  const initialTab = tab === 'standings' || tab === 'players' ? tab : 'matches';
  const [activeTab, setActiveTab] = useState<PageTab>(initialTab);

  const { data: season, isLoading } = useQuery({
    queryKey: ['seasonById', id],
    queryFn: () => getSeasonByIdPrisma(id),
  });

  const { data: summaryArr } = useQuery({
    queryKey: ['seasonSummary', id],
    queryFn: () => getSeasonSummaryBySeasonIdPrisma(id),
  });

  const summary = (
    summaryArr && summaryArr.length > 0 ? summaryArr[0] : null
  ) as SeasonSummary | null;

  if (isLoading) return <LoadingSpinner />;

  const tabs: { key: PageTab; label: string }[] = [
    { key: 'matches', label: '경기 결과' },
    { key: 'standings', label: '팀 순위' },
    { key: 'players', label: '개인 순위' },
  ];

  return (
    <View className="flex-1 bg-neutral-50">
      <Stack.Screen
        options={{
          title: season?.season_name ?? '시즌',
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
        }}
      />

      {/* 시즌 요약 + 탭 바 */}
      <View className="bg-white pb-0">
        {summary && <SummaryCard summary={summary} />}
        <PageTabBar tabs={tabs} activeTab={activeTab} onSelect={setActiveTab} />
      </View>
      <View className="h-px bg-neutral-200" />

      {/* 탭 콘텐츠 */}
      {activeTab === 'matches' && <MatchesTab seasonId={id} />}
      {activeTab === 'standings' && (
        <StandingsTab seasonId={id} isGLeague={season?.category === 'G_LEAGUE'} />
      )}
      {activeTab === 'players' && <PlayersTab seasonId={id} />}
    </View>
  );
}
