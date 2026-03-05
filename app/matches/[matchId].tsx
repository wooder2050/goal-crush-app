import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Film, Play } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import {
  getCoachHeadToHeadListByMatchIdPrisma,
  getHeadToHeadByMatchIdPrisma,
  getHeadToHeadListByMatchIdPrisma,
  getKeyPlayersByMatchIdPrisma,
  getMatchAssistsPrisma,
  getMatchByIdPrisma,
  getMatchDetailedStatsPrisma,
  getMatchGoalsPrisma,
  getMatchLineupsPrisma,
  getMatchPassMapPrisma,
  getMatchRatingsPrisma,
  getMatchXtRatingsPrisma,
  getPenaltyShootoutDetailsPrisma,
  getSubstitutionsPrisma,
  LineupPlayer,
  MatchDetailedStats,
  PlayerMatchRating,
  PlayerMatchXtRating,
  TeamPassNetworkData,
} from '@/api/matches';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TeamLogo } from '@/components/TeamLogo';
import { Card } from '@/components/ui/Card';
import { MatchWithTeams } from '@/lib/types';

const NUM = { fontVariant: ['tabular-nums' as const] };

/* ── 밝은 색상 판단 (YIQ) ── */
function isLightColor(hex: string): boolean {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 180;
}

/* ── 팀 표시 색상 (밝으면 secondary 사용) ── */
function teamDisplayColor(primary?: string | null, secondary?: string | null) {
  const p = primary || '#3b82f6';
  const s = secondary || '#FFFFFF';
  if (isLightColor(p)) {
    return { bg: s, text: p };
  }
  return { bg: p, text: s };
}

/* ── 포지션 뱃지 색상 ── */
function posBg(pos: string) {
  const p = pos?.toUpperCase();
  if (p === 'GK') return 'bg-amber-100 text-amber-700';
  if (['DF', 'CB', 'LB', 'RB'].includes(p)) return 'bg-blue-100 text-blue-700';
  if (['MF', 'CM', 'DM', 'AM', 'LM', 'RM'].includes(p)) return 'bg-emerald-100 text-emerald-700';
  return 'bg-rose-100 text-rose-700';
}

/* ── 평점 색상 ── */
function ratingBg(r: number) {
  if (r >= 8.0) return 'bg-blue-500';
  if (r >= 6.5) return 'bg-emerald-500';
  return 'bg-amber-500';
}

/* ── 섹션 제목 ── */
function SectionTitle({ title }: { title: string }) {
  return (
    <View className="mb-3 flex-row items-center">
      <View className="mr-2 h-4 w-1 rounded-full bg-primary" />
      <Text className="text-base font-bold text-neutral-800">{title}</Text>
    </View>
  );
}

/* ── 탭 토글 ── */
function TabToggle({
  tabs,
  active,
  onSelect,
}: {
  tabs: { key: string; label: string }[];
  active: string;
  onSelect: (key: string) => void;
}) {
  return (
    <View className="mb-3 flex-row rounded-lg bg-neutral-100 p-0.5">
      {tabs.map((t) => (
        <Pressable
          key={t.key}
          className={`flex-1 items-center rounded-md py-1.5 ${active === t.key ? 'bg-white' : ''}`}
          onPress={() => onSelect(t.key)}
          style={
            active === t.key
              ? {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06,
                  shadowRadius: 2,
                  elevation: 1,
                }
              : undefined
          }
        >
          <Text
            className={`text-xs font-semibold ${active === t.key ? 'text-neutral-900' : 'text-neutral-400'}`}
          >
            {t.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/* ══════════════════════════════════════════════
   메인 페이지
   ══════════════════════════════════════════════ */
export default function MatchDetailScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const id = Number(matchId);

  const {
    data: match,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['match-by-id', id],
    queryFn: () => getMatchByIdPrisma(id),
  });

  const isCompleted = match?.status === 'completed';

  const { data: goals } = useQuery({
    queryKey: ['matchGoals', id],
    queryFn: () => getMatchGoalsPrisma(id),
    enabled: !!match && isCompleted,
  });

  const { data: assists } = useQuery({
    queryKey: ['matchAssists', id],
    queryFn: () => getMatchAssistsPrisma(id),
    enabled: !!match && isCompleted,
  });

  const { data: lineups } = useQuery({
    queryKey: ['matchLineups', id],
    queryFn: () => getMatchLineupsPrisma(id),
    enabled: !!match,
  });

  const { data: substitutions } = useQuery({
    queryKey: ['matchSubstitutions', id],
    queryFn: () => getSubstitutionsPrisma(id),
    enabled: !!match && isCompleted,
  });

  const hasPenalty = match?.penalty_home_score != null && match?.penalty_away_score != null;

  const { data: penalties } = useQuery({
    queryKey: ['matchPenalties', id],
    queryFn: () => getPenaltyShootoutDetailsPrisma(id),
    enabled: !!match && hasPenalty,
  });

  const { data: h2hSummary } = useQuery({
    queryKey: ['matchH2H', id],
    queryFn: () => getHeadToHeadByMatchIdPrisma(id),
    enabled: !!match,
  });

  const { data: h2hList } = useQuery({
    queryKey: ['matchH2HList', id],
    queryFn: () => getHeadToHeadListByMatchIdPrisma(id),
    enabled: !!match,
  });

  const { data: coachH2H } = useQuery({
    queryKey: ['matchCoachH2H', id],
    queryFn: () => getCoachHeadToHeadListByMatchIdPrisma(id),
    enabled: !!match,
  });

  const { data: detailedStats } = useQuery({
    queryKey: ['matchDetailedStats', id],
    queryFn: () => getMatchDetailedStatsPrisma(id),
    enabled: !!match && isCompleted,
  });

  const { data: ratings } = useQuery({
    queryKey: ['matchRatings', id],
    queryFn: () => getMatchRatingsPrisma(id),
    enabled: !!match && isCompleted,
  });

  const { data: xtRatings } = useQuery({
    queryKey: ['matchXtRatings', id],
    queryFn: () => getMatchXtRatingsPrisma(id),
    enabled: !!match && isCompleted,
  });

  const { data: passMapData } = useQuery({
    queryKey: ['matchPassMap', id],
    queryFn: () => getMatchPassMapPrisma(id),
    enabled: !!match && isCompleted,
  });

  const { data: keyPlayers } = useQuery({
    queryKey: ['matchKeyPlayers', id],
    queryFn: () => getKeyPlayersByMatchIdPrisma(id),
    enabled: !!match,
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError || !match) return <ErrorState onRetry={() => refetch()} />;

  const homeTeam = match.home_team;
  const awayTeam = match.away_team;
  const allPlayers: LineupPlayer[] = lineups ? Object.values(lineups).flat() : [];
  const homeLineups = allPlayers.filter((p) => p.team_id === homeTeam?.team_id);
  const awayLineups = allPlayers.filter((p) => p.team_id === awayTeam?.team_id);

  // 어시스트 맵 (goal_id → player name)
  const assistMap = new Map<number, string>();
  if (assists && Array.isArray(assists)) {
    for (const a of assists as Array<{ goal_id: number; player?: { name?: string } }>) {
      if (a.goal_id && a.player?.name) assistMap.set(a.goal_id, a.player.name);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `${homeTeam?.team_name ?? ''} vs ${awayTeam?.team_name ?? ''}`,
          headerShown: true,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <ScrollView
        className="flex-1 bg-neutral-50"
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => refetch()} tintColor="#ff4800" />
        }
        showsVerticalScrollIndicator={false}
      >
        <ScoreHeader match={match} router={router} />

        <View className="gap-3 px-4 pb-10 pt-3">
          <MediaLinks match={match} />

          {isCompleted && goals && goals.length > 0 && (
            <GoalSection
              goals={goals}
              assistMap={assistMap}
              homeTeamId={homeTeam?.team_id}
              router={router}
            />
          )}

          <FeaturedPlayersSection
            match={match}
            lineups={lineups}
            goals={goals}
            ratings={ratings}
            keyPlayers={keyPlayers}
            router={router}
          />

          {hasPenalty && penalties && penalties.length > 0 && (
            <PenaltySection penalties={penalties} match={match} router={router} />
          )}

          {(homeLineups.length > 0 || awayLineups.length > 0) && (
            <LineupSection
              homeLineups={homeLineups}
              awayLineups={awayLineups}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              substitutions={substitutions}
              router={router}
            />
          )}

          {detailedStats && detailedStats.length > 0 && (
            <>
              <TeamStatsSection stats={detailedStats} homeTeam={homeTeam} awayTeam={awayTeam} />

              {((ratings && ratings.ratings.length > 0) ||
                (xtRatings && xtRatings.ratings.length > 0)) && (
                <RatingsSection
                  statsRatings={ratings?.ratings ?? []}
                  xtRatings={xtRatings?.ratings ?? []}
                  homeTeam={homeTeam}
                  awayTeam={awayTeam}
                  router={router}
                />
              )}

              <PlayerDetailedStatsSection
                stats={detailedStats}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
                router={router}
              />

              {passMapData && passMapData.length > 0 && (
                <PassMapSection data={passMapData} match={match} />
              )}
            </>
          )}

          {!(detailedStats && detailedStats.length > 0) && (
            <>
              {h2hSummary && h2hSummary.summary && h2hSummary.summary.total > 0 && (
                <HeadToHeadSection h2h={h2hSummary} h2hList={h2hList} router={router} />
              )}

              {coachH2H && coachH2H.total > 0 && (
                <CoachHeadToHeadSection coachH2H={coachH2H} router={router} />
              )}
            </>
          )}
        </View>
      </ScrollView>
    </>
  );
}

/* ══════════════════════════════════════════════
   1. 스코어 헤더
   ══════════════════════════════════════════════ */
function ScoreHeader({
  match,
  router,
}: {
  match: MatchWithTeams;
  router: ReturnType<typeof useRouter>;
}) {
  const isCompleted = match.status === 'completed';
  const hasPK = match.penalty_home_score != null && match.penalty_away_score != null;
  const homeWon = isCompleted && (match.home_score ?? 0) > (match.away_score ?? 0);
  const awayWon = isCompleted && (match.away_score ?? 0) > (match.home_score ?? 0);

  return (
    <View className="overflow-hidden bg-white pb-5 pt-4">
      <View
        className="absolute left-0 right-0 top-0 bg-primary"
        style={{ height: 100, opacity: 0.03 }}
      />

      {/* 시즌 + 설명 + 날짜 */}
      <View className="items-center px-5">
        {match.season && (
          <View className="rounded-full bg-primary/10 px-3 py-1">
            <Text className="text-[11px] font-bold text-primary">{match.season.season_name}</Text>
          </View>
        )}
        {match.description && (
          <Text className="mt-1.5 text-center text-[11px] text-neutral-400">
            {match.description}
          </Text>
        )}
        <Text className="mt-1 text-center text-xs text-neutral-400">
          {match.match_date ? format(new Date(match.match_date), 'yyyy년 M월 d일') : ''}
        </Text>
      </View>

      {/* 팀 + 스코어 */}
      <View className="mt-5 flex-row items-center justify-center px-5">
        <Pressable
          className="flex-1 items-center"
          onPress={() => match.home_team && router.push(`/teams/${match.home_team.team_id}`)}
        >
          <View
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <TeamLogo uri={match.home_team?.logo} size={56} teamName={match.home_team?.team_name} />
          </View>
          <Text
            className={`mt-2.5 text-center text-sm font-bold ${homeWon ? 'text-neutral-900' : 'text-neutral-600'}`}
          >
            {match.home_team?.team_name}
          </Text>
          {match.home_coach && (
            <Pressable
              onPress={() => router.push(`/coaches/${match.home_coach!.coach_id}`)}
              hitSlop={8}
            >
              <Text className="mt-0.5 text-center text-[11px] text-primary/60">
                {match.home_coach.name}
              </Text>
            </Pressable>
          )}
        </Pressable>

        <View className="mx-3 items-center">
          {isCompleted ? (
            <>
              <View className="rounded-2xl bg-neutral-900 px-5 py-2.5">
                <Text className="text-2xl font-extrabold text-white" style={NUM}>
                  {match.home_score} : {match.away_score}
                </Text>
              </View>
              {hasPK && (
                <View className="mt-1.5 rounded-full bg-amber-50 px-2.5 py-0.5">
                  <Text className="text-[10px] font-bold text-amber-700" style={NUM}>
                    PK {match.penalty_home_score}-{match.penalty_away_score}
                  </Text>
                </View>
              )}
              <View className="mt-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5">
                <Text className="text-[10px] font-semibold text-emerald-600">종료</Text>
              </View>
            </>
          ) : (
            <>
              <View className="rounded-2xl bg-neutral-100 px-5 py-2.5">
                <Text className="text-xl font-bold text-neutral-300">VS</Text>
              </View>
              {match.match_date && (
                <Text className="mt-2 text-sm font-medium text-neutral-500" style={NUM}>
                  {format(new Date(match.match_date), 'HH:mm')}
                </Text>
              )}
            </>
          )}
        </View>

        <Pressable
          className="flex-1 items-center"
          onPress={() => match.away_team && router.push(`/teams/${match.away_team.team_id}`)}
        >
          <View
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <TeamLogo uri={match.away_team?.logo} size={56} teamName={match.away_team?.team_name} />
          </View>
          <Text
            className={`mt-2.5 text-center text-sm font-bold ${awayWon ? 'text-neutral-900' : 'text-neutral-600'}`}
          >
            {match.away_team?.team_name}
          </Text>
          {match.away_coach && (
            <Pressable
              onPress={() => router.push(`/coaches/${match.away_coach!.coach_id}`)}
              hitSlop={8}
            >
              <Text className="mt-0.5 text-center text-[11px] text-primary/60">
                {match.away_coach.name}
              </Text>
            </Pressable>
          )}
        </Pressable>
      </View>

      {match.location && (
        <Text className="mt-3 text-center text-[11px] text-neutral-400">{match.location}</Text>
      )}
    </View>
  );
}

/* ══════════════════════════════════════════════
   2. 미디어 링크
   ══════════════════════════════════════════════ */
function MediaLinks({ match }: { match: MatchWithTeams }) {
  if (!match.highlight_url && !match.full_video_url) return null;
  return (
    <View className="flex-row" style={{ gap: 8 }}>
      {match.highlight_url && (
        <Pressable
          className="flex-1 flex-row items-center justify-center rounded-xl bg-neutral-900 py-3 active:bg-neutral-800"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
          onPress={() => Linking.openURL(match.highlight_url!)}
        >
          <Film size={16} color="#fff" />
          <Text className="ml-2 text-sm font-semibold text-white">하이라이트</Text>
        </Pressable>
      )}
      {match.full_video_url && (
        <Pressable
          className="flex-1 flex-row items-center justify-center rounded-xl border border-neutral-200 bg-white py-3 active:bg-neutral-50"
          onPress={() => Linking.openURL(match.full_video_url!)}
        >
          <Play size={16} color="#525252" />
          <Text className="ml-2 text-sm font-medium text-neutral-700">풀영상</Text>
        </Pressable>
      )}
    </View>
  );
}

/* ══════════════════════════════════════════════
   3. 골 섹션
   ══════════════════════════════════════════════ */
function GoalSection({
  goals,
  assistMap,
  homeTeamId,
  router,
}: {
  goals: Array<{
    goal_id: number;
    player_id: number;
    goal_time?: number | null;
    goal_type?: string | null;
    player?: { name?: string };
    team?: { team_id: number; team_name: string } | null;
  }>;
  assistMap: Map<number, string>;
  homeTeamId?: number;
  router: ReturnType<typeof useRouter>;
}) {
  const homeGoals = goals.filter((g) => g.team?.team_id === homeTeamId);
  const awayGoals = goals.filter((g) => g.team?.team_id !== homeTeamId);

  function GoalRow({ g }: { g: (typeof goals)[0] }) {
    const typeLabel =
      g.goal_type === 'penalty' ? ' (PK)' : g.goal_type === 'own_goal' ? ' (OG)' : '';
    const assist = assistMap.get(g.goal_id);
    return (
      <Pressable
        className="py-1.5 active:opacity-70"
        onPress={() => g.player_id && router.push(`/players/${g.player_id}`)}
      >
        <View className="flex-row items-center">
          <View className="h-5 w-7 items-center justify-center rounded bg-neutral-100">
            <Text className="text-[10px] font-bold text-neutral-500" style={NUM}>
              {g.goal_time ? `${g.goal_time}'` : ''}
            </Text>
          </View>
          <Text className="ml-1.5 text-[13px] font-semibold text-neutral-800">
            {g.player?.name}
            {typeLabel && (
              <Text className="text-[11px] font-normal text-neutral-400">{typeLabel}</Text>
            )}
          </Text>
        </View>
        {assist && (
          <Text className="ml-[34px] text-[10px] text-neutral-400">어시스트: {assist}</Text>
        )}
      </Pressable>
    );
  }

  return (
    <Card className="p-4">
      <SectionTitle title="골" />
      <View className="flex-row">
        <View className="flex-1" style={{ gap: 2 }}>
          {homeGoals.map((g) => (
            <GoalRow key={g.goal_id} g={g} />
          ))}
        </View>
        <View className="mx-2 w-px bg-neutral-100" />
        <View className="flex-1" style={{ gap: 2 }}>
          {awayGoals.map((g) => (
            <GoalRow key={g.goal_id} g={g} />
          ))}
        </View>
      </View>
    </Card>
  );
}

/* ══════════════════════════════════════════════
   4. 승부차기 상세
   ══════════════════════════════════════════════ */
function PenaltySection({
  penalties,
  match,
  router,
}: {
  penalties: Array<{
    penalty_detail_id: number;
    team_id: number;
    kicker_order: number;
    kicker_id: number;
    is_successful: boolean;
    kicker: { player_id: number; name: string };
    team: { team_id: number; team_name: string };
  }>;
  match: MatchWithTeams;
  router: ReturnType<typeof useRouter>;
}) {
  const homeId = match.home_team_id;
  const homePKs = penalties
    .filter((p) => p.team_id === homeId)
    .sort((a, b) => a.kicker_order - b.kicker_order);
  const awayPKs = penalties
    .filter((p) => p.team_id !== homeId)
    .sort((a, b) => a.kicker_order - b.kicker_order);
  const maxRounds = Math.max(homePKs.length, awayPKs.length);

  return (
    <Card className="p-4">
      <SectionTitle title="승부차기 상세" />
      <View className="mb-3 flex-row items-center justify-center" style={{ gap: 12 }}>
        <Text className="text-sm font-semibold text-neutral-700">{match.home_team?.team_name}</Text>
        <Text className="text-lg font-bold text-neutral-900" style={NUM}>
          {match.penalty_home_score} - {match.penalty_away_score}
        </Text>
        <Text className="text-sm font-semibold text-neutral-700">{match.away_team?.team_name}</Text>
      </View>
      {Array.from({ length: maxRounds }).map((_, i) => {
        const hk = homePKs[i];
        const ak = awayPKs[i];
        return (
          <View
            key={i}
            className={`flex-row items-center py-2.5 ${i < maxRounds - 1 ? 'border-b border-neutral-100' : ''}`}
          >
            <View className="flex-1 flex-row items-center justify-end" style={{ gap: 6 }}>
              {hk ? (
                <>
                  <Pressable onPress={() => router.push(`/players/${hk.kicker_id}`)}>
                    <Text className="text-[13px] text-neutral-700">{hk.kicker.name}</Text>
                  </Pressable>
                  <View
                    className={`h-5 w-5 items-center justify-center rounded-full ${hk.is_successful ? 'bg-emerald-100' : 'bg-red-100'}`}
                  >
                    <Text
                      className={`text-[10px] font-bold ${hk.is_successful ? 'text-emerald-600' : 'text-red-500'}`}
                    >
                      {hk.is_successful ? '✓' : '✗'}
                    </Text>
                  </View>
                </>
              ) : (
                <Text className="text-xs text-neutral-300">-</Text>
              )}
            </View>
            <View className="mx-3 h-6 w-6 items-center justify-center rounded-full bg-neutral-100">
              <Text className="text-[10px] font-bold text-neutral-400" style={NUM}>
                {i + 1}
              </Text>
            </View>
            <View className="flex-1 flex-row items-center" style={{ gap: 6 }}>
              {ak ? (
                <>
                  <View
                    className={`h-5 w-5 items-center justify-center rounded-full ${ak.is_successful ? 'bg-emerald-100' : 'bg-red-100'}`}
                  >
                    <Text
                      className={`text-[10px] font-bold ${ak.is_successful ? 'text-emerald-600' : 'text-red-500'}`}
                    >
                      {ak.is_successful ? '✓' : '✗'}
                    </Text>
                  </View>
                  <Pressable onPress={() => router.push(`/players/${ak.kicker_id}`)}>
                    <Text className="text-[13px] text-neutral-700">{ak.kicker.name}</Text>
                  </Pressable>
                </>
              ) : (
                <Text className="text-xs text-neutral-300">-</Text>
              )}
            </View>
          </View>
        );
      })}
    </Card>
  );
}

/* ══════════════════════════════════════════════
   5. 라인업 섹션 (교체 출전 + 벤치)
   ══════════════════════════════════════════════ */
function LineupSection({
  homeLineups,
  awayLineups,
  homeTeam,
  awayTeam,
  substitutions: _substitutions,
  router,
}: {
  homeLineups: LineupPlayer[];
  awayLineups: LineupPlayer[];
  homeTeam: MatchWithTeams['home_team'];
  awayTeam: MatchWithTeams['away_team'];
  substitutions?: Array<{
    substitution_id: number;
    team_id: number;
    player_in_id: number;
    substitution_time?: number | null;
    player_in?: { player_id: number; name: string };
  }>;
  router: ReturnType<typeof useRouter>;
}) {
  function TeamLineup({
    players,
    team,
    teamId: _teamId,
  }: {
    players: LineupPlayer[];
    team: typeof homeTeam;
    teamId?: number;
  }) {
    const starters = players.filter((p) => p.participation_status === 'starting');
    const subs = players.filter((p) => p.participation_status === 'substitute');
    const bench = players.filter((p) => p.participation_status === 'bench');

    return (
      <Card className="p-4">
        <View className="mb-3 flex-row items-center">
          <TeamLogo uri={team?.logo} size={18} teamName={team?.team_name} />
          <Text className="ml-2 text-sm font-bold text-neutral-800">{team?.team_name}</Text>
        </View>

        {/* 선발 */}
        {starters.map((p, i) => (
          <Pressable
            key={p.stat_id}
            className={`flex-row items-center py-2 ${i < starters.length - 1 ? 'border-b border-neutral-50' : ''}`}
            onPress={() => router.push(`/players/${p.player_id}`)}
          >
            <Text className="w-7 text-center text-[11px] font-medium text-neutral-400" style={NUM}>
              {p.jersey_number != null ? `#${p.jersey_number}` : ''}
            </Text>
            <Text className="ml-1.5 flex-1 text-[13px] text-neutral-800">{p.player_name}</Text>
            <View className="flex-row items-center" style={{ gap: 3 }}>
              {p.goals > 0 && (
                <Text className="text-[10px]">{'⚽'.repeat(Math.min(p.goals, 3))}</Text>
              )}
              {p.assists > 0 && (
                <Text className="text-[10px]">{'🎯'.repeat(Math.min(p.assists, 3))}</Text>
              )}
              {p.yellow_cards > 0 && <Text className="text-[10px]">🟨</Text>}
              {p.red_cards > 0 && <Text className="text-[10px]">🟥</Text>}
            </View>
            <View className={`ml-2 rounded px-1.5 py-0.5 ${posBg(p.position)}`}>
              <Text className="text-[10px] font-semibold">{p.position}</Text>
            </View>
          </Pressable>
        ))}

        {/* 교체 출전 */}
        {subs.length > 0 && (
          <View className="mt-3 border-t border-neutral-100 pt-3">
            <Text className="mb-2 text-xs font-semibold text-neutral-500">교체 출전</Text>
            {subs.map((p, i) => (
              <Pressable
                key={p.stat_id}
                className={`flex-row items-center py-2 ${i < subs.length - 1 ? 'border-b border-neutral-50' : ''}`}
                onPress={() => router.push(`/players/${p.player_id}`)}
              >
                <Text
                  className="w-7 text-center text-[11px] font-medium text-neutral-400"
                  style={NUM}
                >
                  {p.jersey_number != null ? `#${p.jersey_number}` : ''}
                </Text>
                <Text className="ml-1.5 flex-1 text-[13px] text-neutral-600">{p.player_name}</Text>
                <View className="flex-row items-center" style={{ gap: 3 }}>
                  {p.goals > 0 && (
                    <Text className="text-[10px]">{'⚽'.repeat(Math.min(p.goals, 3))}</Text>
                  )}
                  {p.assists > 0 && (
                    <Text className="text-[10px]">{'🎯'.repeat(Math.min(p.assists, 3))}</Text>
                  )}
                  {p.yellow_cards > 0 && <Text className="text-[10px]">🟨</Text>}
                  {p.red_cards > 0 && <Text className="text-[10px]">🟥</Text>}
                </View>
                <View className={`ml-2 rounded px-1.5 py-0.5 ${posBg(p.position)}`}>
                  <Text className="text-[10px] font-semibold">{p.position}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* 벤치 */}
        {bench.length > 0 && (
          <View className="mt-3 border-t border-neutral-100 pt-3">
            <Text className="mb-2 text-xs font-semibold text-neutral-500">벤치</Text>
            <View className="flex-row flex-wrap" style={{ gap: 6 }}>
              {bench.map((p) => (
                <Pressable key={p.stat_id} onPress={() => router.push(`/players/${p.player_id}`)}>
                  <Text className="text-[12px] text-neutral-500">
                    {p.jersey_number != null ? `#${p.jersey_number} ` : ''}
                    {p.player_name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </Card>
    );
  }

  return (
    <>
      <SectionTitle title="출전 선수" />
      <TeamLineup players={homeLineups} team={homeTeam} teamId={homeTeam?.team_id} />
      <TeamLineup players={awayLineups} team={awayTeam} teamId={awayTeam?.team_id} />
    </>
  );
}

/* ══════════════════════════════════════════════
   6. 상대전적
   ══════════════════════════════════════════════ */
function HeadToHeadSection({
  h2h,
  h2hList,
  router,
}: {
  h2h: Awaited<ReturnType<typeof getHeadToHeadByMatchIdPrisma>>;
  h2hList?: Awaited<ReturnType<typeof getHeadToHeadListByMatchIdPrisma>>;
  router: ReturnType<typeof useRouter>;
}) {
  const s = h2h.summary;
  return (
    <Card className="p-4">
      <SectionTitle title="상대전적" />
      <View className="flex-row items-center justify-between">
        <View className="flex-1 items-center" style={{ gap: 2 }}>
          <TeamLogo uri={h2h.teamA?.logo} size={32} teamName={h2h.teamA?.team_name} />
          <Text className="text-xs font-semibold text-neutral-700" numberOfLines={1}>
            {h2h.teamA?.team_name}
          </Text>
          <Text className="text-lg font-bold text-blue-600" style={NUM}>
            {s.teamA.wins}
          </Text>
          <Text className="text-[10px] text-neutral-400">승</Text>
        </View>
        <View className="items-center" style={{ gap: 2 }}>
          <Text className="text-xs text-neutral-400">총 {s.total}경기</Text>
          <Text className="text-xl font-bold text-neutral-700" style={NUM}>
            {s.teamA.wins} : {s.teamB.wins}
          </Text>
          <Text className="text-[10px] text-neutral-400">
            득점 {s.teamA.goals_for}:{s.teamB.goals_for}
          </Text>
        </View>
        <View className="flex-1 items-center" style={{ gap: 2 }}>
          <TeamLogo uri={h2h.teamB?.logo} size={32} teamName={h2h.teamB?.team_name} />
          <Text className="text-xs font-semibold text-neutral-700" numberOfLines={1}>
            {h2h.teamB?.team_name}
          </Text>
          <Text className="text-lg font-bold text-red-500" style={NUM}>
            {s.teamB.wins}
          </Text>
          <Text className="text-[10px] text-neutral-400">승</Text>
        </View>
      </View>
      {h2hList?.items && h2hList.items.length > 0 && (
        <View className="mt-4 border-t border-neutral-100 pt-3">
          <Text className="mb-2 text-xs font-semibold text-neutral-500">이전 경기</Text>
          {h2hList.items.slice(0, 5).map((m) => (
            <Pressable
              key={m.match_id}
              className="flex-row items-center py-2 active:bg-neutral-50"
              onPress={() => router.push(`/matches/${m.match_id}`)}
            >
              <Text className="w-[52px] text-[10px] text-neutral-400" style={NUM}>
                {format(new Date(m.match_date), 'yy.MM.dd')}
              </Text>
              <View className="flex-1 flex-row items-center justify-center" style={{ gap: 4 }}>
                <Text
                  className="text-[12px] text-neutral-600"
                  numberOfLines={1}
                  style={{ maxWidth: 70, textAlign: 'right' }}
                >
                  {m.home?.team_name}
                </Text>
                <Text className="text-[13px] font-bold text-neutral-800" style={NUM}>
                  {m.score.home ?? 0} - {m.score.away ?? 0}
                </Text>
                <Text
                  className="text-[12px] text-neutral-600"
                  numberOfLines={1}
                  style={{ maxWidth: 70 }}
                >
                  {m.away?.team_name}
                </Text>
              </View>
              {m.penalty && m.penalty.home != null && (
                <Text className="text-[9px] text-amber-600" style={NUM}>
                  PK {m.penalty.home}-{m.penalty.away}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      )}
    </Card>
  );
}

/* ══════════════════════════════════════════════
   6-2. 감독 상대전적
   ══════════════════════════════════════════════ */
function CoachHeadToHeadSection({
  coachH2H,
  router,
}: {
  coachH2H: Awaited<ReturnType<typeof getCoachHeadToHeadListByMatchIdPrisma>>;
  router: ReturnType<typeof useRouter>;
}) {
  if (!coachH2H || coachH2H.total === 0 || coachH2H.items.length === 0) return null;

  const { current, items } = coachH2H;
  if (!current.home_coach_id || !current.away_coach_id) return null;

  // 승수 계산
  let homeWins = 0;
  let awayWins = 0;
  let draws = 0;
  for (const m of items) {
    const hs = m.score.home ?? 0;
    const as_ = m.score.away ?? 0;

    // 감독 기준: home_coach가 어느 쪽에 있는지
    const homeCoachIsHome = m.home.coach_id === current.home_coach_id;
    const homeCoachScore = homeCoachIsHome ? hs : as_;
    const awayCoachScore = homeCoachIsHome ? as_ : hs;

    if (m.penalty && m.penalty.home != null && m.penalty.away != null) {
      const pkHome = homeCoachIsHome ? m.penalty.home : m.penalty.away;
      const pkAway = homeCoachIsHome ? m.penalty.away : m.penalty.home;
      if (pkHome > pkAway) homeWins++;
      else awayWins++;
    } else if (homeCoachScore > awayCoachScore) homeWins++;
    else if (awayCoachScore > homeCoachScore) awayWins++;
    else draws++;
  }

  const total = items.length;

  return (
    <Card className="p-4">
      <SectionTitle title="감독 상대전적" />

      {/* 감독 정보 + 승수 */}
      <View className="flex-row items-center justify-between">
        <Pressable
          className="flex-1 items-center active:opacity-70"
          style={{ gap: 2 }}
          onPress={() => {
            if (current.home_coach_id) router.push(`/coaches/${current.home_coach_id}`);
          }}
        >
          {current.home_coach_image ? (
            <Image
              source={{ uri: current.home_coach_image }}
              style={{ width: 40, height: 40, borderRadius: 20 }}
              contentFit="cover"
              contentPosition="top"
              transition={200}
            />
          ) : (
            <View className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
              <Text className="text-xs font-bold text-neutral-400">
                {current.home_coach_name?.charAt(0)}
              </Text>
            </View>
          )}
          <Text className="text-xs font-semibold text-neutral-700" numberOfLines={1}>
            {current.home_coach_name}
          </Text>
          <Text className="text-lg font-bold text-blue-600" style={NUM}>
            {homeWins}
          </Text>
          <Text className="text-[10px] text-neutral-400">승</Text>
        </Pressable>
        <View className="items-center" style={{ gap: 2 }}>
          <Text className="text-xs text-neutral-400">총 {total}경기</Text>
          <Text className="text-xl font-bold text-neutral-700" style={NUM}>
            {homeWins} : {awayWins}
          </Text>
          <Text className="text-[10px] text-neutral-400">무승부 {draws}</Text>
        </View>
        <Pressable
          className="flex-1 items-center active:opacity-70"
          style={{ gap: 2 }}
          onPress={() => {
            if (current.away_coach_id) router.push(`/coaches/${current.away_coach_id}`);
          }}
        >
          {current.away_coach_image ? (
            <Image
              source={{ uri: current.away_coach_image }}
              style={{ width: 40, height: 40, borderRadius: 20 }}
              contentFit="cover"
              contentPosition="top"
              transition={200}
            />
          ) : (
            <View className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
              <Text className="text-xs font-bold text-neutral-400">
                {current.away_coach_name?.charAt(0)}
              </Text>
            </View>
          )}
          <Text className="text-xs font-semibold text-neutral-700" numberOfLines={1}>
            {current.away_coach_name}
          </Text>
          <Text className="text-lg font-bold text-red-500" style={NUM}>
            {awayWins}
          </Text>
          <Text className="text-[10px] text-neutral-400">승</Text>
        </Pressable>
      </View>

      {/* 이전 경기 목록 */}
      {items.length > 0 && (
        <View className="mt-4 border-t border-neutral-100 pt-3">
          <Text className="mb-2 text-xs font-semibold text-neutral-500">이전 경기</Text>
          {items.slice(0, 5).map((m) => (
            <Pressable
              key={m.match_id}
              className="flex-row items-center py-2 active:bg-neutral-50"
              onPress={() => router.push(`/matches/${m.match_id}`)}
            >
              <Text className="w-[52px] text-[10px] text-neutral-400" style={NUM}>
                {format(new Date(m.match_date), 'yy.MM.dd')}
              </Text>
              <View className="flex-1 flex-row items-center justify-center" style={{ gap: 4 }}>
                <Text
                  className="text-[12px] text-neutral-600"
                  numberOfLines={1}
                  style={{ maxWidth: 70, textAlign: 'right' }}
                >
                  {m.home.team_name}
                </Text>
                <Text className="text-[13px] font-bold text-neutral-800" style={NUM}>
                  {m.score.home ?? 0} - {m.score.away ?? 0}
                </Text>
                <Text
                  className="text-[12px] text-neutral-600"
                  numberOfLines={1}
                  style={{ maxWidth: 70 }}
                >
                  {m.away.team_name}
                </Text>
              </View>
              {m.penalty && m.penalty.home != null && (
                <Text className="text-[9px] text-amber-600" style={NUM}>
                  PK {m.penalty.home}-{m.penalty.away}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      )}
    </Card>
  );
}

/* ══════════════════════════════════════════════
   7. 팀 상세 통계 비교 (FotMob 스타일)
   ══════════════════════════════════════════════ */
function TeamStatsSection({
  stats,
  homeTeam,
  awayTeam,
}: {
  stats: MatchDetailedStats[];
  homeTeam: MatchWithTeams['home_team'];
  awayTeam: MatchWithTeams['away_team'];
}) {
  const hs = stats.filter((s) => s.team_id === homeTeam?.team_id);
  const as_ = stats.filter((s) => s.team_id === awayTeam?.team_id);
  const sum = (arr: MatchDetailedStats[], k: keyof MatchDetailedStats) =>
    arr.reduce((a, s) => a + (Number(s[k]) || 0), 0);

  const homeC = teamDisplayColor(homeTeam?.primary_color, homeTeam?.secondary_color);
  const awayC = teamDisplayColor(awayTeam?.primary_color, awayTeam?.secondary_color);

  // 점유율 계산
  const homePossession = sum(hs, 'possession_time');
  const awayPossession = sum(as_, 'possession_time');
  const totalPossession = homePossession + awayPossession;
  const homePossPct = totalPossession > 0 ? (homePossession / totalPossession) * 100 : 50;
  const awayPossPct = totalPossession > 0 ? (awayPossession / totalPossession) * 100 : 50;

  const categories = [
    {
      title: '공격',
      rows: [
        { label: '슈팅', home: sum(hs, 'shots'), away: sum(as_, 'shots') },
        { label: '유효 슈팅', home: sum(hs, 'shots_on_target'), away: sum(as_, 'shots_on_target') },
        { label: '드리블', home: sum(hs, 'dribbles'), away: sum(as_, 'dribbles') },
      ],
    },
    {
      title: '패스',
      rows: [
        { label: '패스', home: sum(hs, 'passes'), away: sum(as_, 'passes') },
        {
          label: '패스 성공',
          home: sum(hs, 'passes_completed'),
          away: sum(as_, 'passes_completed'),
        },
        { label: '키 패스', home: sum(hs, 'key_passes'), away: sum(as_, 'key_passes') },
      ],
    },
    {
      title: '수비',
      rows: [
        { label: '태클', home: sum(hs, 'tackles'), away: sum(as_, 'tackles') },
        { label: '인터셉트', home: sum(hs, 'interceptions'), away: sum(as_, 'interceptions') },
        { label: '클리어런스', home: sum(hs, 'clearances'), away: sum(as_, 'clearances') },
      ],
    },
    {
      title: '기타',
      rows: [
        { label: '파울', home: sum(hs, 'fouls'), away: sum(as_, 'fouls') },
        { label: '코너킥', home: sum(hs, 'corner_kicks'), away: sum(as_, 'corner_kicks') },
        { label: '선방', home: sum(hs, 'saves'), away: sum(as_, 'saves') },
      ],
    },
  ];

  return (
    <Card className="p-4">
      <SectionTitle title="팀 통계" />

      {/* 팀 헤더 (로고 + 이름) */}
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-row items-center" style={{ gap: 6 }}>
          <TeamLogo uri={homeTeam?.logo} size={20} teamName={homeTeam?.team_name} />
          <Text className="text-xs font-semibold text-neutral-800">{homeTeam?.team_name}</Text>
        </View>
        <View className="flex-row items-center" style={{ gap: 6 }}>
          <Text className="text-xs font-semibold text-neutral-800">{awayTeam?.team_name}</Text>
          <TeamLogo uri={awayTeam?.logo} size={20} teamName={awayTeam?.team_name} />
        </View>
      </View>

      {/* 점유율 바 */}
      {totalPossession > 0 && (
        <View className="mb-4 border-b border-neutral-100 pb-4">
          <Text className="mb-3 text-center text-[12px] font-bold text-neutral-700">점유율</Text>
          <View className="h-8 flex-row overflow-hidden rounded-lg">
            <View
              className="items-start justify-center pl-2.5"
              style={{ width: `${homePossPct}%`, backgroundColor: homeC.bg }}
            >
              <Text className="text-[11px] font-bold" style={{ ...NUM, color: homeC.text }}>
                {homePossPct.toFixed(1)}%
              </Text>
            </View>
            <View
              className="flex-1 items-end justify-center pr-2.5"
              style={{ backgroundColor: awayC.bg }}
            >
              <Text className="text-[11px] font-bold" style={{ ...NUM, color: awayC.text }}>
                {awayPossPct.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 카테고리별 통계 */}
      {categories.map((cat) => (
        <View
          key={cat.title}
          className="mb-4 border-b border-neutral-100 pb-4 last:mb-0 last:border-b-0 last:pb-0"
        >
          <Text className="mb-3 text-center text-[12px] font-bold text-neutral-700">
            {cat.title}
          </Text>
          {cat.rows.map((row) => {
            const homeHigher = row.home > row.away;
            const awayHigher = row.away > row.home;
            return (
              <View key={row.label} className="flex-row items-center justify-between py-1.5">
                {/* 홈팀 값 */}
                <View className="w-14">
                  {homeHigher ? (
                    <View
                      className="self-start rounded-full px-2 py-0.5"
                      style={{ backgroundColor: homeC.bg }}
                    >
                      <Text className="text-[12px] font-bold" style={{ ...NUM, color: homeC.text }}>
                        {row.home}
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-[12px] text-neutral-500" style={NUM}>
                      {row.home}
                    </Text>
                  )}
                </View>
                {/* 항목명 */}
                <Text className="flex-1 text-center text-[11px] text-neutral-500">{row.label}</Text>
                {/* 어웨이팀 값 */}
                <View className="w-14 items-end">
                  {awayHigher ? (
                    <View
                      className="self-end rounded-full px-2 py-0.5"
                      style={{ backgroundColor: awayC.bg }}
                    >
                      <Text className="text-[12px] font-bold" style={{ ...NUM, color: awayC.text }}>
                        {row.away}
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-[12px] text-neutral-500" style={NUM}>
                      {row.away}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </Card>
  );
}

/* ── 선수 상세 통계 카테고리 ── */
type StatDef = { key: string; label: string; suffix?: string; lowerIsBetter?: boolean };
type StatCatDef = { name: string; stats: StatDef[] };

const FIELD_STAT_CATEGORIES: StatCatDef[] = [
  {
    name: '득점/점유',
    stats: [
      { key: 'goals', label: '골' },
      { key: 'assists', label: '어시스트' },
      { key: 'possession_time', label: '점유 시간' },
    ],
  },
  {
    name: '파울',
    stats: [
      { key: 'yellow_cards', label: '옐로카드' },
      { key: 'red_cards', label: '레드카드' },
      { key: 'fouls', label: '반칙' },
    ],
  },
  {
    name: '패스',
    stats: [
      { key: 'passes', label: '패스' },
      { key: 'passes_completed', label: '패스 성공' },
      { key: 'pass_accuracy', label: '성공률', suffix: '%' },
      { key: 'key_passes', label: '키패스' },
    ],
  },
  {
    name: '공격',
    stats: [
      { key: 'shots', label: '슛' },
      { key: 'shots_on_target', label: '유효슛' },
      { key: 'shot_accuracy', label: '유효률', suffix: '%' },
      { key: 'dribbles', label: '드리블' },
    ],
  },
  {
    name: '수비',
    stats: [
      { key: 'tackles', label: '태클' },
      { key: 'tackles_won', label: '태클 성공' },
      { key: 'interceptions', label: '인터셉트' },
      { key: 'clearances', label: '클리어링' },
    ],
  },
  {
    name: '세트피스',
    stats: [
      { key: 'free_kicks', label: '프리킥' },
      { key: 'free_kick_goals', label: '프리킥 골' },
      { key: 'corner_kicks', label: '코너킥' },
      { key: 'throw_ins', label: '킥인' },
      { key: 'penalty_goals', label: 'PK 골' },
    ],
  },
];

const GK_STAT_CATEGORY: StatCatDef = {
  name: '골키퍼',
  stats: [
    { key: 'saves', label: '세이브' },
    { key: 'goals_conceded', label: '실점', lowerIsBetter: true },
    { key: 'gk_throws', label: 'GK 쓰로잉' },
    { key: 'gk_throws_completed', label: 'GK 성공' },
  ],
};

function formatPossessionTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function hasGkStats(s: MatchDetailedStats) {
  return s.saves > 0 || s.gk_throws > 0 || s.gk_throws_completed > 0;
}

/* ── 통계 테이블 행 렌더링 ── */
function StatPlayerRow({
  s,
  category,
  maxValues,
  globalMaxValues,
  teamColor,
  router,
  isLast,
}: {
  s: MatchDetailedStats;
  category: StatCatDef;
  maxValues: Record<string, number>;
  globalMaxValues?: Record<string, number>;
  teamColor?: { bg: string; text: string };
  router: ReturnType<typeof useRouter>;
  isLast: boolean;
}) {
  return (
    <Pressable
      className={`flex-row items-center py-2.5 ${!isLast ? 'border-b border-neutral-50' : ''}`}
      onPress={() => router.push(`/players/${s.player_id}`)}
    >
      <View className="flex-1 flex-row items-center" style={{ gap: 4 }}>
        {s.player?.profile_image_url ? (
          <Image
            source={{ uri: s.player.profile_image_url }}
            style={{ width: 24, height: 24, borderRadius: 12 }}
            contentFit="cover"
          />
        ) : (
          <View className="h-6 w-6 items-center justify-center rounded-full bg-neutral-100">
            <Text className="text-[9px] font-bold text-neutral-400">
              {s.player?.name?.charAt(0)}
            </Text>
          </View>
        )}
        <View className="flex-1">
          <Text className="text-[12px] font-medium text-neutral-800" numberOfLines={1}>
            {s.player?.name}
          </Text>
          {s.player?.jersey_number != null && (
            <Text className="text-[9px] text-neutral-400" style={NUM}>
              #{s.player.jersey_number}
            </Text>
          )}
        </View>
      </View>
      {category.stats.map((stat) => {
        const raw = s[stat.key as keyof MatchDetailedStats];
        const numVal = typeof raw === 'number' ? raw : 0;
        let display: string;
        if (stat.key === 'possession_time') {
          display = formatPossessionTime(numVal);
        } else if (stat.suffix === '%' && typeof raw === 'number') {
          display = raw.toFixed(1);
        } else {
          display = numVal === 0 ? '-' : String(numVal);
        }

        // 최소 시도 횟수 조건
        let meetsMin = true;
        if (stat.key === 'pass_accuracy') meetsMin = s.passes >= 7;
        else if (stat.key === 'shot_accuracy') meetsMin = s.shots >= 3;

        const isGlobalBest =
          teamColor &&
          globalMaxValues &&
          meetsMin &&
          !stat.lowerIsBetter &&
          numVal > 0 &&
          numVal === globalMaxValues[stat.key];
        const isTeamBest =
          !isGlobalBest &&
          meetsMin &&
          !stat.lowerIsBetter &&
          numVal > 0 &&
          numVal === maxValues[stat.key];

        if (isGlobalBest && teamColor) {
          return (
            <View key={stat.key} className="w-12 items-center">
              <View
                className="rounded-full px-1.5 py-0.5"
                style={{ backgroundColor: teamColor.bg }}
              >
                <Text
                  className="text-[10px] font-bold text-center"
                  style={{ ...NUM, color: teamColor.text }}
                >
                  {display}
                  {stat.suffix && numVal > 0 ? stat.suffix : ''}
                </Text>
              </View>
            </View>
          );
        }
        if (isTeamBest && teamColor) {
          const lightBg = isLightColor(teamColor.bg) ? `${teamColor.bg}80` : `${teamColor.bg}25`;
          const lightText = isLightColor(teamColor.bg) ? teamColor.text : teamColor.bg;
          return (
            <View key={stat.key} className="w-12 items-center">
              <View className="rounded-full px-1.5 py-0.5" style={{ backgroundColor: lightBg }}>
                <Text
                  className="text-[10px] font-semibold text-center"
                  style={{ ...NUM, color: lightText }}
                >
                  {display}
                  {stat.suffix && numVal > 0 ? stat.suffix : ''}
                </Text>
              </View>
            </View>
          );
        }
        return (
          <Text
            key={stat.key}
            className="w-12 text-center text-[11px] text-neutral-600"
            style={NUM}
          >
            {display}
            {stat.suffix && numVal > 0 ? stat.suffix : ''}
          </Text>
        );
      })}
    </Pressable>
  );
}

function calcMaxValues(players: MatchDetailedStats[], category: StatCatDef) {
  const maxValues: Record<string, number> = {};
  for (const stat of category.stats) {
    let eligible = players;
    if (stat.key === 'pass_accuracy') eligible = players.filter((p) => p.passes >= 7);
    else if (stat.key === 'shot_accuracy') eligible = players.filter((p) => p.shots >= 3);
    const vals = eligible.map((p) => {
      const v = p[stat.key as keyof MatchDetailedStats];
      return typeof v === 'number' ? v : 0;
    });
    maxValues[stat.key] = vals.length > 0 ? Math.max(...vals) : 0;
  }
  return maxValues;
}

/* ══════════════════════════════════════════════
   8. 선수별 상세 통계
   ══════════════════════════════════════════════ */
function PlayerDetailedStatsSection({
  stats,
  homeTeam,
  awayTeam,
  router,
}: {
  stats: MatchDetailedStats[];
  homeTeam: MatchWithTeams['home_team'];
  awayTeam: MatchWithTeams['away_team'];
  router: ReturnType<typeof useRouter>;
}) {
  const [tab, setTab] = useState<'home' | 'away'>('home');
  const [catIdx, setCatIdx] = useState(0);

  const homeStats = stats.filter((s) => s.team_id === homeTeam?.team_id);
  const awayStats = stats.filter((s) => s.team_id === awayTeam?.team_id);
  const teamStats = tab === 'home' ? homeStats : awayStats;

  const category = FIELD_STAT_CATEGORIES[catIdx];
  const maxValues = calcMaxValues(teamStats, category);

  // 양팀 글로벌 최대값 (양팀 통틀어 best)
  const globalMaxValues = calcMaxValues(stats, category);

  // 현재 선택된 팀 색상
  const currentTeam = tab === 'home' ? homeTeam : awayTeam;
  const teamColor = teamDisplayColor(currentTeam?.primary_color, currentTeam?.secondary_color);

  // 카테고리 탭 활성 색상도 팀 컬러 사용
  const catActiveStyle = { backgroundColor: teamColor.bg };
  const catActiveTextColor = { color: teamColor.text };

  // 골키퍼 분리
  const gkPlayers = teamStats.filter(hasGkStats);
  const gkMaxValues = calcMaxValues(gkPlayers, GK_STAT_CATEGORY);
  const gkGlobalMaxValues = calcMaxValues(stats.filter(hasGkStats), GK_STAT_CATEGORY);

  return (
    <Card className="p-4">
      <SectionTitle title="선수 상세 통계" />
      <TabToggle
        tabs={[
          { key: 'home', label: homeTeam?.team_name ?? '홈' },
          { key: 'away', label: awayTeam?.team_name ?? '어웨이' },
        ]}
        active={tab}
        onSelect={(k) => setTab(k as 'home' | 'away')}
      />

      {/* 필드 플레이어 카테고리 탭 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-3"
        contentContainerStyle={{ gap: 6 }}
      >
        {FIELD_STAT_CATEGORIES.map((cat, idx) => (
          <Pressable
            key={cat.name}
            onPress={() => setCatIdx(idx)}
            className={`rounded-full px-3 py-1.5 ${catIdx !== idx ? 'bg-neutral-100' : ''}`}
            style={catIdx === idx ? catActiveStyle : undefined}
          >
            <Text
              className={`text-[11px] font-medium ${catIdx !== idx ? 'text-neutral-600' : ''}`}
              style={catIdx === idx ? catActiveTextColor : undefined}
            >
              {cat.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* 필드 플레이어 테이블 헤더 */}
      <View className="flex-row items-center border-b border-neutral-100 pb-2">
        <Text className="flex-1 text-[10px] font-semibold text-neutral-500">선수</Text>
        {category.stats.map((stat) => (
          <Text
            key={stat.key}
            className="w-12 text-center text-[9px] font-semibold text-neutral-500"
            numberOfLines={1}
          >
            {stat.label}
          </Text>
        ))}
      </View>

      {teamStats.length === 0 ? (
        <View className="items-center py-6">
          <Text className="text-[12px] text-neutral-400">데이터가 없습니다.</Text>
        </View>
      ) : (
        teamStats.map((s, i) => (
          <StatPlayerRow
            key={s.detailed_stat_id}
            s={s}
            category={category}
            maxValues={maxValues}
            globalMaxValues={globalMaxValues}
            teamColor={teamColor}
            router={router}
            isLast={i === teamStats.length - 1}
          />
        ))
      )}

      {/* 골키퍼 통계 (별도 섹션) */}
      {gkPlayers.length > 0 && (
        <View className="mt-5 border-t border-neutral-200 pt-4">
          <Text className="mb-3 text-sm font-bold text-neutral-700">골키퍼</Text>
          <View className="flex-row items-center border-b border-neutral-100 pb-2">
            <Text className="flex-1 text-[10px] font-semibold text-neutral-500">선수</Text>
            {GK_STAT_CATEGORY.stats.map((stat) => (
              <Text
                key={stat.key}
                className="w-12 text-center text-[9px] font-semibold text-neutral-500"
                numberOfLines={1}
              >
                {stat.label}
              </Text>
            ))}
          </View>
          {gkPlayers.map((s, i) => (
            <StatPlayerRow
              key={s.detailed_stat_id}
              s={s}
              category={GK_STAT_CATEGORY}
              maxValues={gkMaxValues}
              globalMaxValues={gkGlobalMaxValues}
              teamColor={teamColor}
              router={router}
              isLast={i === gkPlayers.length - 1}
            />
          ))}
        </View>
      )}
    </Card>
  );
}

/* ══════════════════════════════════════════════
   9. 선수 평점 (2종류: Stats + xT)
   ══════════════════════════════════════════════ */
function RatingsSection({
  statsRatings,
  xtRatings,
  homeTeam,
  awayTeam,
  router,
}: {
  statsRatings: PlayerMatchRating[];
  xtRatings: PlayerMatchXtRating[];
  homeTeam: MatchWithTeams['home_team'];
  awayTeam: MatchWithTeams['away_team'];
  router: ReturnType<typeof useRouter>;
}) {
  const hasStats = statsRatings.length > 0;
  const hasXt = xtRatings.length > 0;
  const tabs = [];
  if (hasStats) tabs.push({ key: 'stats', label: 'Stats 평점' });
  if (hasXt) tabs.push({ key: 'xt', label: 'xT 평점' });
  const [tab, setTab] = useState(tabs[0]?.key ?? 'stats');

  function StatsRatingCard({
    team,
    ratings,
  }: {
    team: typeof homeTeam;
    ratings: PlayerMatchRating[];
  }) {
    const sorted = [...ratings].sort((a, b) => b.rating - a.rating);
    const bestId = sorted[0]?.player_id;
    if (sorted.length === 0) return null;

    return (
      <View className="mt-2">
        <View className="mb-2 flex-row items-center">
          <TeamLogo uri={team?.logo} size={16} teamName={team?.team_name} />
          <Text className="ml-1.5 text-xs font-bold text-neutral-700">{team?.team_name}</Text>
        </View>
        {sorted.map((p, i) => (
          <Pressable
            key={p.player_id}
            className={`flex-row items-center py-2 ${i < sorted.length - 1 ? 'border-b border-neutral-50' : ''}`}
            onPress={() => router.push(`/players/${p.player_id}`)}
          >
            {p.profile_image_url ? (
              <Image
                source={{ uri: p.profile_image_url }}
                style={{ width: 28, height: 28, borderRadius: 14 }}
                contentFit="cover"
              />
            ) : (
              <View className="h-7 w-7 items-center justify-center rounded-full bg-neutral-100">
                <Text className="text-[10px] font-bold text-neutral-400">
                  {p.player_name?.charAt(0)}
                </Text>
              </View>
            )}
            <View className="ml-2 flex-1">
              <View className="flex-row items-center" style={{ gap: 3 }}>
                <Text className="text-[12px] font-semibold text-neutral-800">{p.player_name}</Text>
                {p.player_id === bestId && <Text className="text-[10px]">⭐</Text>}
              </View>
              <View className="flex-row items-center" style={{ gap: 3 }}>
                <View className={`rounded px-1 py-0.5 ${posBg(p.position)}`}>
                  <Text className="text-[8px] font-semibold">{p.position}</Text>
                </View>
                {p.goals > 0 && (
                  <Text className="text-[9px]">{'⚽'.repeat(Math.min(p.goals, 3))}</Text>
                )}
                {p.assists > 0 && (
                  <Text className="text-[9px]">{'🎯'.repeat(Math.min(p.assists, 3))}</Text>
                )}
                {p.yellow_cards > 0 && <Text className="text-[9px]">🟨</Text>}
                {p.red_cards > 0 && <Text className="text-[9px]">🟥</Text>}
              </View>
            </View>
            <View className={`rounded-lg px-2 py-1 ${ratingBg(p.rating)}`}>
              <Text className="text-xs font-bold text-white" style={NUM}>
                {p.rating.toFixed(1)}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    );
  }

  function XtRatingCard({
    team,
    ratings,
  }: {
    team: typeof homeTeam;
    ratings: PlayerMatchXtRating[];
  }) {
    const sorted = [...ratings].sort((a, b) => b.xt_rating - a.xt_rating);
    const bestId = sorted[0]?.player_id;
    if (sorted.length === 0) return null;

    return (
      <View className="mt-2">
        <View className="mb-2 flex-row items-center">
          <TeamLogo uri={team?.logo} size={16} teamName={team?.team_name} />
          <Text className="ml-1.5 text-xs font-bold text-neutral-700">{team?.team_name}</Text>
        </View>
        {sorted.map((p, i) => (
          <Pressable
            key={p.player_id}
            className={`flex-row items-center py-2 ${i < sorted.length - 1 ? 'border-b border-neutral-50' : ''}`}
            onPress={() => router.push(`/players/${p.player_id}`)}
          >
            {p.profile_image_url ? (
              <Image
                source={{ uri: p.profile_image_url }}
                style={{ width: 28, height: 28, borderRadius: 14 }}
                contentFit="cover"
              />
            ) : (
              <View className="h-7 w-7 items-center justify-center rounded-full bg-neutral-100">
                <Text className="text-[10px] font-bold text-neutral-400">
                  {p.player_name?.charAt(0)}
                </Text>
              </View>
            )}
            <View className="ml-2 flex-1">
              <View className="flex-row items-center" style={{ gap: 3 }}>
                <Text className="text-[12px] font-semibold text-neutral-800">{p.player_name}</Text>
                {p.player_id === bestId && <Text className="text-[10px]">⭐</Text>}
              </View>
              <View className="flex-row items-center" style={{ gap: 3 }}>
                <View className={`rounded px-1 py-0.5 ${posBg(p.position)}`}>
                  <Text className="text-[8px] font-semibold">{p.position}</Text>
                </View>
                <Text className="text-[9px] text-neutral-400">
                  공격 {p.offensive_xt.toFixed(2)} / 수비 {p.defensive_xt.toFixed(2)}
                </Text>
              </View>
            </View>
            <View className={`rounded-lg px-2 py-1 ${ratingBg(p.xt_rating)}`}>
              <Text className="text-xs font-bold text-white" style={NUM}>
                {p.xt_rating.toFixed(1)}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    );
  }

  const homeStatsR = statsRatings.filter((r) => r.team_id === homeTeam?.team_id);
  const awayStatsR = statsRatings.filter((r) => r.team_id === awayTeam?.team_id);
  const homeXtR = xtRatings.filter((r) => r.team_id === homeTeam?.team_id);
  const awayXtR = xtRatings.filter((r) => r.team_id === awayTeam?.team_id);

  return (
    <Card className="p-4">
      <SectionTitle title="선수 평점" />
      {tabs.length > 1 && <TabToggle tabs={tabs} active={tab} onSelect={setTab} />}
      {tab === 'stats' ? (
        <>
          <StatsRatingCard team={homeTeam} ratings={homeStatsR} />
          <StatsRatingCard team={awayTeam} ratings={awayStatsR} />
        </>
      ) : (
        <>
          <XtRatingCard team={homeTeam} ratings={homeXtR} />
          <XtRatingCard team={awayTeam} ratings={awayXtR} />
        </>
      )}
    </Card>
  );
}

/* ══════════════════════════════════════════════
   10. 베스트 플레이어
   ══════════════════════════════════════════════ */

interface SelectedPlayer {
  player_id: number;
  name: string;
  goals: number;
  assists: number;
  jersey_number: number | null;
  profile_image_url: string | null;
  position: string | null;
  rating: number | null;
}

function FeaturedPlayersSection({
  match,
  lineups,
  goals,
  ratings,
  keyPlayers,
  router,
}: {
  match: MatchWithTeams;
  lineups?: Record<string, LineupPlayer[]> | null;
  goals?: Array<{
    goal_id: number;
    player_id: number;
    goal_type?: string | null;
    team?: { team_id: number } | null;
  }> | null;
  ratings?: { ratings: PlayerMatchRating[] } | null;
  keyPlayers?: Awaited<ReturnType<typeof getKeyPlayersByMatchIdPrisma>> | null;
  router: ReturnType<typeof useRouter>;
}) {
  const isCompleted = match.status === 'completed';
  const allPlayers: LineupPlayer[] = lineups ? Object.values(lineups).flat() : [];
  const homePlayers = allPlayers.filter((p) => p.team_id === match.home_team_id);
  const awayPlayers = allPlayers.filter((p) => p.team_id === match.away_team_id);

  // 자책골 맵
  const ownGoalsByPlayer = useMemo(() => {
    if (!goals) return {};
    return goals.reduce<Record<number, number>>((acc, g) => {
      if (g.goal_type === 'own_goal') {
        acc[g.player_id] = (acc[g.player_id] || 0) + 1;
      }
      return acc;
    }, {});
  }, [goals]);

  const [homePick, awayPick] = useMemo(() => {
    // 예정된 경기: keyPlayers에서 선택
    if (!isCompleted) {
      if (!keyPlayers) return [null, null];
      const mapToSelected = (p: (typeof keyPlayers.home)[0] | undefined): SelectedPlayer | null => {
        if (!p) return null;
        return {
          player_id: p.player_id,
          name: p.player_name,
          goals: p.goals,
          assists: p.assists,
          jersey_number: p.jersey_number,
          profile_image_url: p.profile_image_url,
          position: p.position,
          rating: null,
        };
      };
      return [mapToSelected(keyPlayers.home?.[0]), mapToSelected(keyPlayers.away?.[0])];
    }

    // 완료된 경기: 평점 > 골 > 어시 > 출전시간 > 클린시트 GK
    const selectBest = (
      players: LineupPlayer[],
      teamId: number | null,
      conceded: number
    ): SelectedPlayer | null => {
      if (players.length === 0) return null;

      // 평점 데이터가 있으면 최고 평점 선수
      if (ratings?.ratings && ratings.ratings.length > 0 && teamId != null) {
        const teamRatings = ratings.ratings
          .filter((r) => r.team_id === teamId)
          .sort((a, b) => {
            if (b.rating !== a.rating) return b.rating - a.rating;
            if (b.goals !== a.goals) return b.goals - a.goals;
            return b.assists - a.assists;
          });
        if (teamRatings.length > 0) {
          const best = teamRatings[0];
          return {
            player_id: best.player_id,
            name: best.player_name,
            goals: best.goals,
            assists: best.assists,
            jersey_number: best.jersey_number,
            profile_image_url: best.profile_image_url,
            position: best.position,
            rating: best.rating,
          };
        }
      }

      // 평점 없으면 골 > 어시 > 출전시간
      const getGoals = (p: LineupPlayer) =>
        Math.max(0, p.goals - (ownGoalsByPlayer[p.player_id] ?? 0));
      const hasContribution = players.some((p) => getGoals(p) > 0 || p.assists > 0);

      const sorted = [...players].sort((a, b) => {
        if (getGoals(b) !== getGoals(a)) return getGoals(b) - getGoals(a);
        if (b.assists !== a.assists) return b.assists - a.assists;
        return b.minutes_played - a.minutes_played;
      });

      if (hasContribution) {
        const p = sorted[0];
        return {
          player_id: p.player_id,
          name: p.player_name,
          goals: getGoals(p),
          assists: p.assists,
          jersey_number: p.jersey_number,
          profile_image_url: p.profile_image_url,
          position: p.position,
          rating: null,
        };
      }

      // 클린시트 골키퍼
      if (conceded === 0) {
        const gk = players
          .filter((p) => p.position?.toUpperCase() === 'GK')
          .sort((a, b) => b.minutes_played - a.minutes_played)[0];
        if (gk) {
          return {
            player_id: gk.player_id,
            name: gk.player_name,
            goals: 0,
            assists: 0,
            jersey_number: gk.jersey_number,
            profile_image_url: gk.profile_image_url,
            position: gk.position ?? 'GK',
            rating: null,
          };
        }
      }

      return null;
    };

    const concededHome = typeof match.away_score === 'number' ? match.away_score : 0;
    const concededAway = typeof match.home_score === 'number' ? match.home_score : 0;

    return [
      selectBest(homePlayers, match.home_team_id, concededHome),
      selectBest(awayPlayers, match.away_team_id, concededAway),
    ];
  }, [isCompleted, keyPlayers, ratings, homePlayers, awayPlayers, match, ownGoalsByPlayer]);

  if (!homePick && !awayPick) return null;

  function ratingColor(r: number): string {
    if (r >= 9.0) return '#14A0FF';
    if (r >= 7.0) return '#33C771';
    return '#FF963F';
  }

  function PlayerCard({ player, teamLabel }: { player: SelectedPlayer | null; teamLabel: string }) {
    if (!player) {
      return (
        <View className="flex-1 items-center rounded-2xl bg-neutral-50 py-6">
          <Text className="text-xs text-neutral-400">선수 정보 없음</Text>
        </View>
      );
    }

    return (
      <Pressable
        className="flex-1 items-center rounded-2xl bg-white py-4 active:bg-neutral-50"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 1,
        }}
        onPress={() => router.push(`/players/${player.player_id}`)}
      >
        {/* 팀 라벨 */}
        <Text className="mb-2 text-[10px] font-semibold text-neutral-400">{teamLabel}</Text>

        {/* 프로필 이미지 */}
        {player.profile_image_url ? (
          <Image
            source={{ uri: player.profile_image_url }}
            style={{ width: 80, height: 100, borderRadius: 12 }}
            contentFit="cover"
            contentPosition="top"
            transition={200}
          />
        ) : (
          <View
            className="items-center justify-center rounded-xl bg-neutral-100"
            style={{ width: 80, height: 100 }}
          >
            <Text className="text-2xl font-bold text-neutral-300">{player.name?.charAt(0)}</Text>
          </View>
        )}

        {/* 이름 + 등번호 */}
        <View className="mt-2.5 flex-row items-center" style={{ gap: 4 }}>
          <Text className="text-[13px] font-bold text-neutral-900">{player.name}</Text>
          {player.jersey_number != null && (
            <Text className="text-[11px] text-neutral-400" style={NUM}>
              #{player.jersey_number}
            </Text>
          )}
        </View>

        {/* 평점 뱃지 */}
        {player.rating != null && (
          <View
            className="mt-1.5 flex-row items-center rounded-full px-2.5 py-1"
            style={{ backgroundColor: ratingColor(player.rating), gap: 3 }}
          >
            <Text className="text-xs font-bold text-white" style={NUM}>
              {player.rating.toFixed(1)}
            </Text>
            <Text className="text-[10px] text-white/80">★</Text>
          </View>
        )}

        {/* 포지션 */}
        {player.position && (
          <Text className="mt-1 text-[10px] text-neutral-400">{player.position}</Text>
        )}

        {/* 골/어시스트 뱃지 */}
        {(player.goals > 0 || player.assists > 0) && (
          <View className="mt-2 flex-row items-center" style={{ gap: 4 }}>
            {player.goals > 0 && (
              <View
                className="flex-row items-center rounded-full bg-neutral-100 px-2 py-0.5"
                style={{ gap: 2 }}
              >
                <Text className="text-[10px]">⚽</Text>
                <Text className="text-[10px] font-bold text-neutral-700" style={NUM}>
                  {player.goals}
                </Text>
              </View>
            )}
            {player.assists > 0 && (
              <View
                className="flex-row items-center rounded-full bg-blue-50 px-2 py-0.5"
                style={{ gap: 2 }}
              >
                <Text className="text-[10px]">🎯</Text>
                <Text className="text-[10px] font-bold text-blue-700" style={NUM}>
                  {player.assists}
                </Text>
              </View>
            )}
          </View>
        )}
      </Pressable>
    );
  }

  return (
    <Card className="p-4">
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="mr-2 h-4 w-1 rounded-full bg-primary" />
          <Text className="text-base font-bold text-neutral-800">
            {isCompleted ? '베스트 플레이어' : '핵심 선수 (예상)'}
          </Text>
        </View>
        <Text className="text-[10px] text-neutral-400">
          {isCompleted ? '이 경기 기준' : '최근 10경기 기준'}
        </Text>
      </View>
      <View className="flex-row" style={{ gap: 10 }}>
        <PlayerCard player={homePick} teamLabel="홈팀" />
        <PlayerCard player={awayPick} teamLabel="원정팀" />
      </View>
    </Card>
  );
}

/* ══════════════════════════════════════════════
   11. 패스맵
   ══════════════════════════════════════════════ */
function PassMapSection({ data, match }: { data: TeamPassNetworkData[]; match: MatchWithTeams }) {
  const PITCH_WIDTH = 40;
  const PITCH_HEIGHT = 20;
  const SVG_SIZE = 50;
  const GUCHUKJANGSHIN_TEAM_ID = 20;

  function TeamPassMap({ team }: { team: TeamPassNetworkData }) {
    const isHomeTeam = team.team_id === match.home_team_id;
    const isGuchukjangshin = team.team_id === GUCHUKJANGSHIN_TEAM_ID;
    const usePrimary = isGuchukjangshin
      ? team.secondary_color || '#FFFFFF'
      : team.primary_color || '#3b82f6';
    const useSecondary = isGuchukjangshin
      ? team.primary_color || '#3b82f6'
      : team.secondary_color || '#FFFFFF';

    const successRate =
      team.total_passes > 0 ? ((team.success_passes / team.total_passes) * 100).toFixed(1) : '0';

    // 피치 좌표 → SVG 좌표 (90도 회전: 세로형 반코트)
    const toSvgX = (y: number) => {
      const normalizedY = isHomeTeam ? y : PITCH_HEIGHT - y;
      return (normalizedY / PITCH_HEIGHT) * SVG_SIZE;
    };
    const toSvgY = (x: number) => {
      const normalizedX = isHomeTeam ? PITCH_WIDTH - x : x;
      return (normalizedX / PITCH_WIDTH) * SVG_SIZE * 0.85 + 2;
    };

    // 선수 위치 보정 (중심에서 퍼지기 + 겹침 방지)
    const activePlayers = team.players.filter((p) => p.total_passes > 0);

    const adjustedPlayers = React.useMemo(() => {
      if (activePlayers.length === 0) return [];
      const centerX = PITCH_WIDTH / 2;
      const centerY = PITCH_HEIGHT / 2;
      const spreadFactor = 1.5;

      const spread = activePlayers.map((p) => {
        const dx = p.avg_x - centerX;
        const dy = p.avg_y - centerY;
        const margin = 2;
        return {
          ...p,
          display_x: Math.max(margin, Math.min(PITCH_WIDTH - margin, centerX + dx * spreadFactor)),
          display_y: Math.max(margin, Math.min(PITCH_HEIGHT - margin, centerY + dy * spreadFactor)),
        };
      });

      // 겹침 방지
      const minDist = 3;
      for (let i = 0; i < spread.length; i++) {
        for (let j = i + 1; j < spread.length; j++) {
          const dxp = spread[j].display_x - spread[i].display_x;
          const dyp = spread[j].display_y - spread[i].display_y;
          const dist = Math.sqrt(dxp * dxp + dyp * dyp);
          if (dist < minDist && dist > 0) {
            const overlap = (minDist - dist) / 2;
            const angle = Math.atan2(dyp, dxp);
            spread[i].display_x -= Math.cos(angle) * overlap;
            spread[i].display_y -= Math.sin(angle) * overlap;
            spread[j].display_x += Math.cos(angle) * overlap;
            spread[j].display_y += Math.sin(angle) * overlap;
          } else if (dist === 0) {
            spread[j].display_x += 1.5;
            spread[j].display_y += 1;
          }
        }
      }
      return spread;
    }, [activePlayers]);

    // 등번호 → 보정 위치 맵
    const posMap = React.useMemo(() => {
      const m = new Map<number, (typeof adjustedPlayers)[0]>();
      adjustedPlayers.forEach((p) => m.set(p.jersey_number, p));
      return m;
    }, [adjustedPlayers]);

    const maxConn = Math.max(...team.connections.map((c) => c.count), 1);
    const maxPasses = Math.max(...activePlayers.map((p) => p.total_passes), 1);

    return (
      <View className="mt-3">
        {/* 헤더 */}
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-xs font-bold text-neutral-700">{team.team_name} 패스맵</Text>
          <Text className="text-[10px] text-neutral-400">
            패스 {team.total_passes}회 (성공 {team.success_passes}) - {successRate}%
          </Text>
        </View>

        {/* 피치 (정사각형, 세로형 반코트) */}
        <View
          className="overflow-hidden rounded-xl border border-neutral-200 bg-white"
          style={{ aspectRatio: 1 }}
        >
          <Svg width="100%" height="100%" viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}>
            {/* 배경 */}
            <Rect x="0" y="0" width={SVG_SIZE} height={SVG_SIZE} fill="white" />

            {/* 피치 외곽선 */}
            <Rect x="1" y="1" width="48" height="48" fill="none" stroke="#333" strokeWidth={0.3} />

            {/* 하프라인 (위쪽 경계) */}
            <Line x1={1} y1={1} x2={49} y2={1} stroke="#333" strokeWidth={0.3} />

            {/* 센터 서클 (반원, 위쪽) */}
            <Path d="M 17 1 A 8 8 0 0 0 33 1" fill="none" stroke="#333" strokeWidth={0.3} />
            <Circle cx={25} cy={1} r={0.5} fill="#333" />

            {/* 페널티 박스 */}
            <Rect
              x="13"
              y="35"
              width="24"
              height="14"
              fill="none"
              stroke="#333"
              strokeWidth={0.3}
            />
            {/* 골 에어리어 */}
            <Rect x="19" y="43" width="12" height="6" fill="none" stroke="#333" strokeWidth={0.3} />
            {/* 페널티 스팟 */}
            <Circle cx={25} cy={38} r={0.5} fill="#333" />
            {/* 골대 */}
            <Rect x="21" y="49" width="8" height="1" fill="#333" opacity={0.5} />

            {/* 패스 연결선 */}
            {team.connections.map((c, i) => {
              const from = posMap.get(c.from_jersey);
              const to = posMap.get(c.to_jersey);
              if (!from || !to) return null;
              const sw = 0.3 + (c.count / maxConn) * 2.2;
              const opacity = 0.3 + (c.count / maxConn) * 0.5;
              return (
                <Line
                  key={i}
                  x1={toSvgX(from.display_y)}
                  y1={toSvgY(from.display_x)}
                  x2={toSvgX(to.display_y)}
                  y2={toSvgY(to.display_x)}
                  stroke={usePrimary}
                  strokeWidth={sw}
                  opacity={opacity}
                  strokeLinecap="round"
                />
              );
            })}

            {/* 선수 노드 */}
            {adjustedPlayers.map((p) => {
              const r = 2 + (p.total_passes / maxPasses) * 2;
              return (
                <React.Fragment key={p.player_id}>
                  <Circle
                    cx={toSvgX(p.display_y)}
                    cy={toSvgY(p.display_x)}
                    r={r}
                    fill={usePrimary}
                    fillOpacity={0.9}
                    stroke={useSecondary}
                    strokeWidth={0.6}
                  />
                  <SvgText
                    x={toSvgX(p.display_y)}
                    y={toSvgY(p.display_x) + 0.8}
                    fill={useSecondary}
                    fontSize={2.2}
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {p.jersey_number}
                  </SvgText>
                </React.Fragment>
              );
            })}
          </Svg>
        </View>

        {/* 선수별 패스 통계 */}
        <View className="mt-2">
          <View className="flex-row border-b border-neutral-100 py-1">
            <Text className="flex-1 text-[10px] font-semibold text-neutral-400">선수</Text>
            <Text className="w-10 text-center text-[10px] font-semibold text-neutral-400">
              패스
            </Text>
            <Text className="w-10 text-center text-[10px] font-semibold text-neutral-400">
              성공
            </Text>
            <Text className="w-12 text-center text-[10px] font-semibold text-neutral-400">
              성공률
            </Text>
          </View>
          {[...activePlayers]
            .sort((a, b) => b.total_passes - a.total_passes)
            .map((p) => {
              const rate =
                p.total_passes > 0 ? ((p.success_passes / p.total_passes) * 100).toFixed(0) : '0';
              return (
                <View
                  key={p.player_id}
                  className="flex-row items-center border-b border-neutral-50 py-1.5"
                >
                  <View className="flex-1 flex-row items-center" style={{ gap: 4 }}>
                    <Text className="text-[10px] text-neutral-400" style={NUM}>
                      {p.jersey_number}
                    </Text>
                    <Text className="text-[11px] text-neutral-700" numberOfLines={1}>
                      {p.player_name}
                    </Text>
                  </View>
                  <Text className="w-10 text-center text-[11px] text-neutral-600" style={NUM}>
                    {p.total_passes}
                  </Text>
                  <Text className="w-10 text-center text-[11px] text-emerald-600" style={NUM}>
                    {p.success_passes}
                  </Text>
                  <Text className="w-12 text-center text-[11px] text-neutral-600" style={NUM}>
                    {rate}%
                  </Text>
                </View>
              );
            })}
        </View>

        {/* 주요 패스 연결 */}
        {team.connections.length > 0 && (
          <View className="mt-2">
            <Text className="mb-1 text-[10px] font-semibold text-neutral-400">주요 패스 연결</Text>
            <View className="flex-row flex-wrap" style={{ gap: 6 }}>
              {[...team.connections]
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)
                .map((c, i) => (
                  <View key={i} className="rounded bg-neutral-100 px-2 py-1">
                    <Text className="text-[10px] text-neutral-600">
                      {c.from_jersey} → {c.to_jersey}:{' '}
                      <Text className="font-semibold">{c.count}회</Text>
                    </Text>
                  </View>
                ))}
            </View>
          </View>
        )}
      </View>
    );
  }

  return (
    <Card className="p-4">
      <SectionTitle title="패스맵" />
      <Text className="text-[10px] text-neutral-400 -mt-1 mb-1">
        * SPADL 이벤트 시퀀스 기반 집계 (상세 통계와 다를 수 있음)
      </Text>
      {data.map((team) => (
        <TeamPassMap key={team.team_id} team={team} />
      ))}
    </Card>
  );
}
