import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { getPlayersPagePrisma, type PlayersPageItem } from '@/api/players';
import {
  getTeamByIdPrisma,
  getTeamHighlightsPrisma,
  getTeamSeasonStandingsPrisma,
  getTeamStatsPrisma,
  type TeamSeasonStandingRow,
  type TeamStats,
} from '@/api/teams';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TeamLogo } from '@/components/TeamLogo';
import { Card } from '@/components/ui/Card';
import { sanitizeLabel } from '@/lib/utils';

/* ─── helpers ─────────────────────────────────────────────── */

function shortenSeasonName(label: string): string {
  return sanitizeLabel(label);
}

type League = 'super' | 'challenge' | 'playoff' | 'cup' | 'g-league' | 'other';

const LEAGUE_LABELS: Record<League, string> = {
  super: '슈퍼',
  challenge: '챌린지',
  playoff: '플레이오프',
  cup: '컵',
  'g-league': 'G리그',
  other: '기타',
};

const LEAGUE_FULL_LABELS: Record<string, string> = {
  super: '슈퍼리그',
  challenge: '챌린지리그',
  cup: '컵',
  'g-league': 'G리그',
};

const LEAGUE_COLORS: Record<League, { bg: string; text: string }> = {
  super: { bg: 'bg-primary/10', text: 'text-primary' },
  challenge: { bg: 'bg-blue-50', text: 'text-blue-600' },
  playoff: { bg: 'bg-violet-50', text: 'text-violet-600' },
  cup: { bg: 'bg-amber-50', text: 'text-amber-700' },
  'g-league': { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  other: { bg: 'bg-neutral-100', text: 'text-neutral-500' },
};

function getPositionMedal(pos: number): string | null {
  if (pos === 1) return '🥇';
  if (pos === 2) return '🥈';
  if (pos === 3) return '🥉';
  return null;
}

function getPositionColors(pos: number) {
  if (pos === 1) return { bg: 'bg-amber-100', text: 'text-amber-800' };
  if (pos === 2) return { bg: 'bg-neutral-200', text: 'text-neutral-700' };
  if (pos === 3) return { bg: 'bg-orange-100', text: 'text-orange-800' };
  return { bg: 'bg-neutral-100', text: 'text-neutral-600' };
}

function getSeasonIndex(seasonName: string | null | undefined): number {
  if (!seasonName) return 0;
  const mKo = seasonName.match(/시즌\s*(\d+)/);
  if (mKo?.[1]) return parseInt(mKo[1], 10);
  const mEn = seasonName.toLowerCase().match(/season\s*(\d+)/);
  if (mEn?.[1]) return parseInt(mEn[1], 10);
  return 0;
}

function getSeasonOutcome(
  league: League,
  position: number | null,
  seasonName: string | null | undefined,
  category?: string | null,
  isSeasonEnded?: boolean
): { label: string; emoji: string; bg: string; text: string } | null {
  if (!isSeasonEnded || !position) return null;

  const win = { bg: 'bg-primary/10', text: 'text-primary' };
  const up = { bg: 'bg-emerald-50', text: 'text-emerald-700' };
  const down = { bg: 'bg-red-50', text: 'text-red-600' };
  const mid = { bg: 'bg-blue-50', text: 'text-blue-700' };
  const pv = { bg: 'bg-violet-50', text: 'text-violet-700' };
  const ind = { bg: 'bg-indigo-50', text: 'text-indigo-700' };

  if (category === 'GIFA_CUP' && position === 1) return { label: '우승', emoji: '🏆', ...win };

  const isCup =
    typeof seasonName === 'string' &&
    (seasonName.toLowerCase().includes('champion') || seasonName.includes('챔피언'));
  if (isCup && position === 1) return { label: '우승', emoji: '🏆', ...win };

  const si = getSeasonIndex(seasonName);

  if (league === 'super' && position === 1) return { label: '우승', emoji: '🏆', ...win };
  if (league === 'super' && position === 6) return { label: '강등', emoji: '⬇️', ...down };
  if (league === 'super' && position === 5) return { label: '승강 PO', emoji: '↕️', ...mid };
  if (league === 'challenge' && position === 1) return { label: '승격', emoji: '⬆️', ...up };
  if (league === 'challenge' && position === 2) return { label: '승강 PO', emoji: '↕️', ...mid };
  if (league === 'challenge' && position === 4 && si >= 3)
    return { label: '방출', emoji: '❌', ...down };
  if (league === 'cup' && position === 1) return { label: '우승', emoji: '🏆', ...win };
  if (league === 'g-league' && position === 1) return { label: '우승', emoji: '🏆', ...win };
  if (league === 'playoff' && position === 1) return { label: '슈퍼리그행', emoji: '⬆️', ...pv };
  if (league === 'playoff' && position === 2) return { label: '챌린지리그행', emoji: '➡️', ...ind };
  return null;
}

function getPositionColor(pos: string | null | undefined) {
  if (!pos) return { bg: 'bg-neutral-100', text: 'text-neutral-500' };
  const p = pos.toUpperCase();
  if (p === 'GK') return { bg: 'bg-amber-50', text: 'text-amber-700' };
  if (p === 'DF') return { bg: 'bg-blue-50', text: 'text-blue-700' };
  if (p === 'MF') return { bg: 'bg-emerald-50', text: 'text-emerald-700' };
  if (p === 'FW') return { bg: 'bg-red-50', text: 'text-red-600' };
  return { bg: 'bg-neutral-100', text: 'text-neutral-500' };
}

const NUM = { fontVariant: ['tabular-nums' as const] };

/* ─── Section Header ──────────────────────────────────────── */

function SectionHeader({ title, trailing }: { title: string; trailing?: React.ReactNode }) {
  return (
    <View className="mb-4 flex-row items-center justify-between">
      <View className="flex-row items-center">
        <View className="mr-2 h-4 w-1 rounded-full bg-primary" />
        <Text className="text-base font-bold text-neutral-800">{title}</Text>
      </View>
      {trailing}
    </View>
  );
}

/* ─── Hero Header ─────────────────────────────────────────── */

function HeroHeader({
  team,
  highlights,
}: {
  team: {
    team_name: string;
    logo?: string | null;
    founded_year?: number | null;
    description?: string | null;
  };
  highlights?: Awaited<ReturnType<typeof getTeamHighlightsPrisma>> | null;
}) {
  const championCount = highlights?.championships.count ?? 0;

  return (
    <View className="overflow-hidden bg-white">
      {/* Subtle top accent wash */}
      <View
        className="absolute left-0 right-0 top-0 bg-primary"
        style={{ height: 120, opacity: 0.04 }}
      />

      <View className="items-center px-5 pb-5 pt-6">
        {/* Logo with elevation ring */}
        <View
          className="items-center justify-center rounded-full bg-white"
          style={{
            width: 104,
            height: 104,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 4,
          }}
        >
          <TeamLogo uri={team.logo} size={96} teamName={team.team_name} />
        </View>

        {/* Championship pill */}
        {championCount > 0 && (
          <View
            className="mt-2.5 flex-row items-center rounded-full bg-amber-50 px-3 py-1"
            style={{ gap: 4 }}
          >
            <Text className="text-xs">🏆</Text>
            <Text className="text-xs font-bold text-amber-700" style={NUM}>
              {championCount}회 우승
            </Text>
          </View>
        )}

        <Text className="mt-3 text-xl font-bold tracking-tight text-neutral-900">
          {team.team_name}
        </Text>

        {team.founded_year && (
          <Text className="mt-1 text-[13px] text-neutral-400">{team.founded_year}년 창단</Text>
        )}

        {team.description && (
          <Text className="mt-2.5 text-center text-[13px] leading-5 text-neutral-500">
            {team.description}
          </Text>
        )}
      </View>
    </View>
  );
}

/* ─── Highlights Section (2x2 Grid) ──────────────────────── */

function HighlightsSection({
  highlights,
  router,
}: {
  highlights: Awaited<ReturnType<typeof getTeamHighlightsPrisma>>;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <View>
      <SectionHeader title="주요 기록" />
      <View style={{ gap: 10 }}>
        {/* Row 1 */}
        <View className="flex-row" style={{ gap: 10 }}>
          <HighlightCard
            icon="🎽"
            iconBg="bg-indigo-50"
            label="최다 출장"
            onPlayerPress={
              highlights.top_appearances
                ? () => router.push(`/players/${highlights.top_appearances!.player_id}`)
                : undefined
            }
            playerName={highlights.top_appearances?.name}
            statValue={highlights.top_appearances?.appearances}
            statUnit="경기"
          />
          <HighlightCard
            icon="⚽️"
            iconBg="bg-red-50"
            label="최다 득점"
            onPlayerPress={
              highlights.top_scorer
                ? () => router.push(`/players/${highlights.top_scorer!.player_id}`)
                : undefined
            }
            playerName={highlights.top_scorer?.name}
            statValue={highlights.top_scorer?.goals}
            statUnit="골"
          />
        </View>

        {/* Row 2 */}
        <View className="flex-row" style={{ gap: 10 }}>
          {/* 우승 기록 */}
          <Card className="flex-1 p-3.5">
            <View className="flex-row items-center" style={{ gap: 5 }}>
              <View className="h-6 w-6 items-center justify-center rounded-full bg-amber-50">
                <Text className="text-[11px]">🏆</Text>
              </View>
              <Text className="text-[11px] font-semibold text-neutral-400">우승 기록</Text>
            </View>
            {highlights.championships.count > 0 ? (
              <View className="mt-2.5 flex-row flex-wrap" style={{ gap: 4 }}>
                {highlights.championships.seasons.map((s) => (
                  <View
                    key={s.season_id}
                    className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5"
                  >
                    <Text className="text-[9px] font-semibold text-amber-800">
                      🏆 {shortenSeasonName(s.season_name ?? `시즌 ${s.year ?? ''}`)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="mt-3 text-xs text-neutral-300">기록 없음</Text>
            )}
          </Card>

          {/* 최고 순위 */}
          <Card className="flex-1 p-3.5">
            <View className="flex-row items-center" style={{ gap: 5 }}>
              <View className="h-6 w-6 items-center justify-center rounded-full bg-emerald-50">
                <Text className="text-[11px]">📈</Text>
              </View>
              <Text className="text-[11px] font-semibold text-neutral-400">최고 순위</Text>
            </View>
            {highlights.championships.count > 0 ? (
              <View className="mt-2.5">
                <Text className="text-lg font-extrabold text-neutral-900" style={NUM}>
                  1위
                </Text>
                <Text className="text-[11px] text-neutral-400">(슈퍼리그/컵)</Text>
              </View>
            ) : highlights.best_overall?.position ? (
              <View className="mt-2.5">
                <Text className="text-lg font-extrabold text-neutral-900" style={NUM}>
                  {highlights.best_overall.position}위
                </Text>
                <Text className="text-[11px] text-neutral-400">
                  ({LEAGUE_FULL_LABELS[highlights.best_overall.league ?? ''] ?? ''})
                </Text>
                {highlights.best_overall.league === 'challenge' &&
                  highlights.best_positions?.super && (
                    <Text className="mt-0.5 text-[10px] text-neutral-400">
                      슈퍼리그 최고 {highlights.best_positions.super}위
                    </Text>
                  )}
              </View>
            ) : (
              <Text className="mt-3 text-xs text-neutral-300">기록 없음</Text>
            )}
          </Card>
        </View>
      </View>
    </View>
  );
}

function HighlightCard({
  icon,
  iconBg,
  label,
  playerName,
  statValue,
  statUnit,
  onPlayerPress,
}: {
  icon: string;
  iconBg: string;
  label: string;
  playerName?: string;
  statValue?: number;
  statUnit: string;
  onPlayerPress?: () => void;
}) {
  return (
    <Card className="flex-1 p-3.5">
      <View className="flex-row items-center" style={{ gap: 5 }}>
        <View className={`h-6 w-6 items-center justify-center rounded-full ${iconBg}`}>
          <Text className="text-[11px]">{icon}</Text>
        </View>
        <Text className="text-[11px] font-semibold text-neutral-400">{label}</Text>
      </View>
      {playerName ? (
        <View className="mt-2.5">
          <Pressable onPress={onPlayerPress} hitSlop={8}>
            <Text className="text-[13px] font-bold text-primary" numberOfLines={1}>
              {playerName}
            </Text>
          </Pressable>
          <Text className="mt-0.5 text-lg font-extrabold text-neutral-900" style={NUM}>
            {statValue}
            <Text className="text-[13px] font-medium text-neutral-400"> {statUnit}</Text>
          </Text>
        </View>
      ) : (
        <Text className="mt-3 text-xs text-neutral-300">기록 없음</Text>
      )}
    </Card>
  );
}

/* ─── Stats Card ──────────────────────────────────────────── */

function StatsCard({ stats }: { stats: TeamStats }) {
  const total = stats.wins + stats.losses;
  const winPct = total > 0 ? stats.wins / total : 0;

  return (
    <View>
      <SectionHeader title="팀 통계" />
      <Card className="p-5">
        {/* Win rate hero */}
        <View className="mb-4 items-center">
          <Text className="text-3xl font-extrabold text-primary" style={NUM}>
            {stats.win_rate}%
          </Text>
          <Text className="mt-0.5 text-[11px] font-medium text-neutral-400">승률</Text>

          {/* Progress bar */}
          <View className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <View
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.min(winPct * 100, 100)}%` }}
            />
          </View>
          <View className="mt-1 w-full flex-row justify-between">
            <Text className="text-[10px] text-emerald-500" style={NUM}>
              {stats.wins}승
            </Text>
            <Text className="text-[10px] text-neutral-400" style={NUM}>
              {stats.draws}무
            </Text>
            <Text className="text-[10px] text-red-400" style={NUM}>
              {stats.losses}패
            </Text>
          </View>
        </View>

        {/* Stats grid */}
        <View className="flex-row" style={{ gap: 8 }}>
          <StatCell label="경기" value={stats.matches} />
          <StatCell label="득점" value={stats.goals_for} accent="text-amber-600" />
          <StatCell label="실점" value={stats.goals_against} accent="text-sky-600" />
          <StatCell
            label="득실차"
            value={stats.goal_diff > 0 ? `+${stats.goal_diff}` : String(stats.goal_diff)}
            accent={
              stats.goal_diff > 0
                ? 'text-emerald-600'
                : stats.goal_diff < 0
                  ? 'text-red-500'
                  : undefined
            }
          />
        </View>
      </Card>
    </View>
  );
}

function StatCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: string;
}) {
  return (
    <View className="flex-1 items-center rounded-xl bg-neutral-50 py-2.5">
      <Text className="text-[10px] font-medium text-neutral-400">{label}</Text>
      <Text className={`mt-0.5 text-base font-bold ${accent ?? 'text-neutral-900'}`} style={NUM}>
        {value}
      </Text>
    </View>
  );
}

/* ─── Squad Section ───────────────────────────────────────── */

function SquadSection({
  players,
  router,
}: {
  players: PlayersPageItem[];
  router: ReturnType<typeof useRouter>;
}) {
  if (!players || players.length === 0) return null;

  const [showAll, setShowAll] = useState(false);
  const INITIAL_COUNT = 8;
  const displayPlayers = showAll ? players : players.slice(0, INITIAL_COUNT);

  return (
    <View>
      <SectionHeader
        title="선수단"
        trailing={
          <Text className="text-xs text-neutral-400" style={NUM}>
            {players.length}명
          </Text>
        }
      />
      <Card className="overflow-hidden p-0">
        {displayPlayers.map((p, idx) => {
          const posColor = getPositionColor(p.position);
          const t = p.totals;
          const isLast = idx === displayPlayers.length - 1 && players.length <= INITIAL_COUNT;

          return (
            <Pressable
              key={p.player_id}
              onPress={() => router.push(`/players/${p.player_id}`)}
              className="active:bg-neutral-50"
            >
              <View
                className={`flex-row items-center px-4 py-3 ${isLast ? '' : 'border-b border-neutral-50'}`}
              >
                {/* Jersey number */}
                <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-neutral-50">
                  <Text className="text-[11px] font-bold text-neutral-500" style={NUM}>
                    {p.jersey_number ?? '-'}
                  </Text>
                </View>

                {/* Name + Position */}
                <View className="mr-2 flex-1">
                  <Text className="text-[13px] font-semibold text-neutral-800" numberOfLines={1}>
                    {p.name}
                  </Text>
                  <View className="mt-0.5 flex-row items-center" style={{ gap: 4 }}>
                    <View className={`rounded px-1.5 py-px ${posColor.bg}`}>
                      <Text className={`text-[9px] font-bold ${posColor.text}`}>
                        {p.position ?? '-'}
                      </Text>
                    </View>
                    {p.seasons && p.seasons.length > 0 && (
                      <Text className="text-[10px] text-neutral-400">{p.seasons.length}시즌</Text>
                    )}
                  </View>
                </View>

                {/* Stats */}
                <View className="flex-row items-center" style={{ gap: 12 }}>
                  <View className="items-center">
                    <Text className="text-[13px] font-bold text-neutral-800" style={NUM}>
                      {t.appearances}
                    </Text>
                    <Text className="text-[9px] text-neutral-400">출전</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-[13px] font-bold text-neutral-800" style={NUM}>
                      {t.goals}
                    </Text>
                    <Text className="text-[9px] text-neutral-400">골</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-[13px] font-bold text-neutral-800" style={NUM}>
                      {t.assists}
                    </Text>
                    <Text className="text-[9px] text-neutral-400">도움</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}

        {/* Show more / less toggle */}
        {players.length > INITIAL_COUNT && (
          <Pressable
            onPress={() => setShowAll(!showAll)}
            className="items-center border-t border-neutral-100 py-3 active:bg-neutral-50"
          >
            <Text className="text-[13px] font-semibold text-primary">
              {showAll ? '접기' : `전체 ${players.length}명 보기`}
            </Text>
          </Pressable>
        )}
      </Card>
    </View>
  );
}

/* ─── Season Standings Section ────────────────────────────── */

function SeasonStandingsSection({ standings }: { standings: TeamSeasonStandingRow[] }) {
  const participated = standings.filter((r) => r.participated);
  if (participated.length === 0) return null;

  return (
    <View>
      <SectionHeader title="시즌별 순위" />
      <Card className="overflow-hidden p-0">
        {participated.map((row, idx) => {
          const outcome = getSeasonOutcome(
            row.league,
            row.position,
            row.season_name,
            row.category,
            row.isSeasonEnded
          );
          const medal = row.position ? getPositionMedal(row.position) : null;
          const posColors = row.position ? getPositionColors(row.position) : null;
          const leagueColor = LEAGUE_COLORS[row.league];
          const isLast = idx === participated.length - 1;

          return (
            <View
              key={`${row.year}-${row.season_id ?? 'na'}`}
              className={`px-4 py-3.5 ${isLast ? '' : 'border-b border-neutral-50'}`}
            >
              {/* Top: Year + Season name + League badge */}
              <View className="flex-row items-center justify-between">
                <View className="flex-1 flex-row items-center" style={{ gap: 6 }}>
                  <Text className="text-[13px] font-bold text-neutral-800" style={NUM}>
                    {row.year}
                  </Text>
                  {row.season_name && (
                    <Text className="flex-1 text-[12px] text-neutral-500" numberOfLines={1}>
                      {shortenSeasonName(row.season_name)}
                    </Text>
                  )}
                </View>
                <View className={`rounded-full px-2 py-0.5 ${leagueColor.bg}`}>
                  <Text className={`text-[10px] font-semibold ${leagueColor.text}`}>
                    {LEAGUE_LABELS[row.league]}
                  </Text>
                </View>
              </View>

              {/* Bottom: Position + Stats + Outcome */}
              <View className="mt-2 flex-row items-center" style={{ gap: 8 }}>
                {row.position ? (
                  <View className={`rounded-lg px-2.5 py-1 ${posColors?.bg ?? 'bg-neutral-100'}`}>
                    <Text className={`text-xs font-bold ${posColors?.text ?? ''}`} style={NUM}>
                      {medal ? `${medal} ` : ''}
                      {row.position}위
                    </Text>
                  </View>
                ) : (
                  <View className="rounded-lg bg-neutral-100 px-2.5 py-1">
                    <Text className="text-xs text-neutral-400">-</Text>
                  </View>
                )}

                <Text className="text-[11px] text-neutral-400" style={NUM}>
                  {row.matches_played}경기
                </Text>
                <Text className="text-[11px] text-neutral-400" style={NUM}>
                  {row.points}점
                </Text>

                {outcome && (
                  <View className={`ml-auto rounded-full px-2.5 py-0.5 ${outcome.bg}`}>
                    <Text className={`text-[10px] font-bold ${outcome.text}`}>
                      {outcome.emoji} {outcome.label}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </Card>
    </View>
  );
}

/* ─── Main Screen ─────────────────────────────────────────── */

export default function TeamDetailScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const router = useRouter();
  const id = Number(teamId);

  const {
    data: team,
    isLoading: teamLoading,
    isError: teamError,
    refetch: refetchTeam,
  } = useQuery({
    queryKey: ['teamById', id],
    queryFn: () => getTeamByIdPrisma(id),
  });

  const { data: stats } = useQuery({
    queryKey: ['teamStats', id],
    queryFn: () => getTeamStatsPrisma(id),
  });

  const { data: highlights } = useQuery({
    queryKey: ['teamHighlights', id],
    queryFn: () => getTeamHighlightsPrisma(id),
  });

  const { data: playersData } = useQuery({
    queryKey: ['teamPlayersPage', id],
    queryFn: () => getPlayersPagePrisma(1, 200, { teamId: id, order: 'apps' }),
  });
  const players = playersData?.items;

  const { data: standings } = useQuery({
    queryKey: ['teamSeasonStandings', id],
    queryFn: () => getTeamSeasonStandingsPrisma(id),
  });

  if (teamLoading) return <LoadingSpinner />;
  if (teamError || !team) return <ErrorState onRetry={() => refetchTeam()} />;

  return (
    <>
      <Stack.Screen
        options={{
          title: team.team_name,
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        className="flex-1 bg-neutral-50"
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => refetchTeam()} tintColor="#ff4800" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <HeroHeader team={team} highlights={highlights} />

        {/* Content */}
        <View className="px-4 pb-12 pt-5" style={{ gap: 20 }}>
          {highlights && <HighlightsSection highlights={highlights} router={router} />}
          {stats && <StatsCard stats={stats} />}
          {players && players.length > 0 && <SquadSection players={players} router={router} />}
          {standings && standings.length > 0 && <SeasonStandingsSection standings={standings} />}
        </View>
      </ScrollView>
    </>
  );
}
