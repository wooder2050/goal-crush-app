import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { getPlayerByIdPrisma, getPlayerSummaryPrisma } from '@/api/players';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TeamLogo } from '@/components/TeamLogo';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { sanitizeLabel } from '@/lib/utils';

const NUM = { fontVariant: ['tabular-nums' as const] };

/* ── 포지션 색상 ── */
const POSITION_COLORS: Record<string, { bg: string; text: string }> = {
  FW: { bg: 'bg-red-50', text: 'text-red-600' },
  MF: { bg: 'bg-green-50', text: 'text-green-600' },
  DF: { bg: 'bg-blue-50', text: 'text-blue-600' },
  GK: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
};

function PositionBadge({ position, count }: { position: string; count?: number }) {
  const colors = POSITION_COLORS[position] ?? { bg: 'bg-neutral-100', text: 'text-neutral-500' };
  return (
    <View className={`rounded-full px-2.5 py-1 ${colors.bg}`}>
      <Text className={`text-[11px] font-bold ${colors.text}`}>
        {position}
        {count != null ? ` (${count})` : ''}
      </Text>
    </View>
  );
}

/* ── 시즌명 축약 ── */
function shortenSeasonName(name: string | null): string {
  return sanitizeLabel(name) || '-';
}

/* ── 통계 박스 ── */
function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <View className="flex-1 items-center py-1">
      <Text className={`text-2xl font-bold ${color ?? 'text-neutral-900'}`} style={NUM}>
        {value}
      </Text>
      <Text className="mt-1 text-xs font-medium text-neutral-400">{label}</Text>
    </View>
  );
}

/* ── 섹션 헤더 ── */
function SectionHeader({ title, trailing }: { title: string; trailing?: React.ReactNode }) {
  return (
    <View className="mb-3 flex-row items-center">
      <View className="mr-2 h-4 w-1 rounded-full bg-primary" />
      <Text className="text-base font-bold text-neutral-800">{title}</Text>
      {trailing && <View className="ml-auto">{trailing}</View>}
    </View>
  );
}

/* ── 경기 결과 뱃지 ── */
function getMatchOutcome(gm: {
  home_score: number | null;
  away_score: number | null;
  penalty_home_score: number | null;
  penalty_away_score: number | null;
  is_home: boolean;
}): { label: string; color: string } {
  const { home_score, away_score, penalty_home_score, penalty_away_score, is_home } = gm;
  if (home_score == null || away_score == null)
    return { label: '-', color: 'bg-neutral-100 text-neutral-500' };

  const myScore = is_home ? home_score : away_score;
  const opScore = is_home ? away_score : home_score;

  if (myScore > opScore) return { label: '승', color: 'bg-emerald-50 text-emerald-600' };
  if (myScore < opScore) return { label: '패', color: 'bg-red-50 text-red-500' };

  // 동점 → 승부차기 확인
  if (penalty_home_score != null && penalty_away_score != null) {
    const myPK = is_home ? penalty_home_score : penalty_away_score;
    const opPK = is_home ? penalty_away_score : penalty_home_score;
    if (myPK > opPK) return { label: 'PK승', color: 'bg-emerald-50 text-emerald-600' };
    return { label: 'PK패', color: 'bg-red-50 text-red-500' };
  }

  return { label: '무', color: 'bg-neutral-100 text-neutral-500' };
}

/* ── 메인 화면 ── */
export default function PlayerDetailScreen() {
  const { playerId } = useLocalSearchParams<{ playerId: string }>();
  const id = Number(playerId);
  const router = useRouter();

  const {
    data: player,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['playerById', id],
    queryFn: () => getPlayerByIdPrisma(id),
  });

  const { data: summary } = useQuery({
    queryKey: ['playerSummary', id],
    queryFn: () => getPlayerSummaryPrisma(id),
  });

  /* ── 같은 팀 레코드 병합 (웹 버전과 동일) ── */
  const mergedTeamHistory = useMemo(() => {
    const raw = summary?.team_history ?? [];
    const map = new Map<
      string,
      {
        team_id: number | null;
        team_name: string | null;
        logo: string | null;
        start_date: string | null;
        end_date: string | null;
        is_active: boolean;
      }
    >();

    raw.forEach((t) => {
      const key = (t.team_name ?? '-').trim();
      const existing = map.get(key);

      if (!existing) {
        map.set(key, {
          team_id: t.team_id ?? null,
          team_name: t.team_name ?? null,
          logo: t.logo ?? null,
          start_date: t.start_date ?? null,
          end_date: t.is_active ? null : (t.end_date ?? null),
          is_active: t.is_active === true,
        });
      } else {
        existing.logo = existing.logo ?? t.logo ?? null;
        // start_date: 가장 이른 날짜
        existing.start_date = [existing.start_date, t.start_date].filter(Boolean).sort()[0] || null;
        if (t.is_active) {
          existing.is_active = true;
          existing.end_date = null;
        } else if (!existing.is_active) {
          existing.end_date = [existing.end_date, t.end_date].filter(Boolean).sort().pop() || null;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.is_active && !b.is_active) return -1;
      if (!a.is_active && b.is_active) return 1;
      return (b.end_date ?? '').localeCompare(a.end_date ?? '');
    });
  }, [summary?.team_history]);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !player) return <ErrorState onRetry={() => refetch()} />;

  const isGK = summary?.primary_position === 'GK';
  const totalGoals = summary?.goal_matches?.reduce((sum, gm) => sum + gm.player_goals, 0) ?? 0;

  return (
    <>
      <Stack.Screen
        options={{
          title: player.name,
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        className="flex-1 bg-neutral-50"
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => refetch()} tintColor="#ff4800" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── 프로필 헤더 ── */}
        <View className="items-center bg-white px-5 pb-7 pt-4">
          <View style={{ position: 'relative' }}>
            {player.profile_image_url ? (
              <Image
                source={{ uri: player.profile_image_url }}
                style={{ width: 96, height: 96, borderRadius: 48 }}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View className="h-24 w-24 items-center justify-center rounded-full bg-neutral-100">
                <Text className="text-3xl font-bold text-neutral-300">
                  {player.name?.charAt(0)}
                </Text>
              </View>
            )}
            {/* 팀 로고 오버레이 - FotMob 스타일 */}
            {mergedTeamHistory.length > 0 && mergedTeamHistory[0].logo && (
              <View
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: '#fff',
                  padding: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                <Image
                  source={{ uri: mergedTeamHistory[0].logo }}
                  style={{ width: 26, height: 26, borderRadius: 13 }}
                  contentFit="cover"
                />
              </View>
            )}
          </View>

          {/* 이름 + 등번호 */}
          <View className="mt-3.5 items-center">
            <Text className="text-xl font-bold tracking-tight text-neutral-900">{player.name}</Text>
            {player.jersey_number != null && (
              <Text className="mt-0.5 text-sm font-semibold text-neutral-400">
                #{player.jersey_number}
              </Text>
            )}
          </View>

          {/* 메인 포지션 + 포지션 빈도 (합산) */}
          {summary?.positions_frequency && summary.positions_frequency.length > 0 && (
            <View className="mt-3 flex-row items-center" style={{ gap: 6 }}>
              {summary.positions_frequency.map((pf) => (
                <PositionBadge key={pf.position} position={pf.position} count={pf.matches} />
              ))}
            </View>
          )}
        </View>

        <View style={{ gap: 16 }} className="px-4 pb-10 pt-4">
          {/* ── 커리어 통계 ── */}
          {summary && (
            <Card className="px-4 py-5">
              <View className="flex-row">
                <StatBox label="출전" value={summary.totals.appearances} />
                <View className="w-px bg-neutral-100" />
                <StatBox label="득점" value={summary.totals.goals} color="text-primary" />
                <View className="w-px bg-neutral-100" />
                <StatBox label="어시스트" value={summary.totals.assists} />
                {isGK && (
                  <>
                    <View className="w-px bg-neutral-100" />
                    <StatBox
                      label="실점"
                      value={summary.totals.goals_conceded}
                      color="text-red-400"
                    />
                  </>
                )}
              </View>
            </Card>
          )}

          {/* ── 소속팀 이력 ── */}
          {mergedTeamHistory.length > 0 &&
            (() => {
              if (mergedTeamHistory.length === 1) {
                const th0 = mergedTeamHistory[0];
                return (
                  <Pressable
                    className="flex-row items-center rounded-2xl border border-neutral-100 bg-white px-4 py-3.5 active:bg-neutral-50"
                    onPress={() => {
                      if (th0.team_id != null) router.push(`/teams/${th0.team_id}`);
                    }}
                  >
                    <Text className="text-[13px] font-medium text-neutral-400">소속팀</Text>
                    <View className="ml-auto flex-row items-center" style={{ gap: 8 }}>
                      <TeamLogo uri={th0.logo} size={24} teamName={th0.team_name ?? ''} />
                      <Text className="text-[13px] font-semibold text-neutral-800">
                        {th0.team_name}
                      </Text>
                      <ChevronRight size={14} color="#d4d4d4" />
                    </View>
                  </Pressable>
                );
              }

              return (
                <Card className="p-5">
                  <SectionHeader title="소속팀 이력" />
                  {mergedTeamHistory.map((th, i) => {
                    const startStr = th.start_date
                      ? format(new Date(th.start_date), 'yyyy.MM')
                      : null;
                    const endStr = th.is_active
                      ? '현재'
                      : th.end_date
                        ? format(new Date(th.end_date), 'yyyy.MM')
                        : null;
                    const dateRange = startStr ? `${startStr} ~ ${endStr ?? ''}` : null;

                    return (
                      <Pressable
                        key={i}
                        className={`flex-row items-center py-3.5 active:bg-neutral-50 ${i < mergedTeamHistory.length - 1 ? 'border-b border-neutral-100' : ''}`}
                        onPress={() => {
                          if (th.team_id != null) router.push(`/teams/${th.team_id}`);
                        }}
                      >
                        <TeamLogo uri={th.logo} size={36} teamName={th.team_name ?? ''} />
                        <View className="ml-3 flex-1">
                          <Text className="text-sm font-semibold text-neutral-800">
                            {th.team_name}
                          </Text>
                          {dateRange && (
                            <Text className="mt-0.5 text-[11px] text-neutral-400">{dateRange}</Text>
                          )}
                        </View>
                        {th.is_active && <Badge variant="success">현재</Badge>}
                        <ChevronRight size={14} color="#d4d4d4" style={{ marginLeft: 4 }} />
                      </Pressable>
                    );
                  })}
                </Card>
              );
            })()}

          {/* ── 시즌별 기록 ── */}
          {summary?.seasons && summary.seasons.length > 0 && (
            <Card className="p-5">
              <SectionHeader title="시즌별 기록" />
              {/* 컬럼 헤더 */}
              <View className="mb-1 flex-row items-center pb-1.5">
                <View className="flex-1" />
                <View className="flex-row items-center" style={{ gap: 10 }}>
                  <Text className="w-7 text-center text-[10px] font-medium text-neutral-400">
                    출전
                  </Text>
                  <Text className="w-7 text-center text-[10px] font-medium text-neutral-400">
                    골
                  </Text>
                  <Text className="w-7 text-center text-[10px] font-medium text-neutral-400">
                    도움
                  </Text>
                </View>
              </View>
              {[...summary.seasons].reverse().map((s, i) => (
                <View
                  key={`${s.season_id}-${s.team_id}-${i}`}
                  className={`flex-row items-center py-3 ${i < summary.seasons.length - 1 ? 'border-b border-neutral-100' : ''}`}
                >
                  {/* 시즌명 + 팀 + 포지션 */}
                  <View className="flex-1 min-w-0" style={{ gap: 2 }}>
                    <View className="flex-row items-center" style={{ gap: 5 }}>
                      <Text className="text-[13px] font-bold text-neutral-800" numberOfLines={1}>
                        {shortenSeasonName(s.season_name)}
                      </Text>
                      {s.positions && s.positions.length > 0 && (
                        <View className="flex-row" style={{ gap: 3 }}>
                          {s.positions.map((pos) => (
                            <PositionBadge key={pos} position={pos} />
                          ))}
                        </View>
                      )}
                    </View>
                    <View className="flex-row items-center" style={{ gap: 4 }}>
                      <TeamLogo uri={s.team_logo} size={14} teamName={s.team_name ?? ''} />
                      <Text className="text-[11px] text-neutral-400" numberOfLines={1}>
                        {s.team_name}
                      </Text>
                    </View>
                  </View>

                  {/* 스탯 */}
                  <View className="flex-row items-center" style={{ gap: 10 }}>
                    <Text
                      className="w-7 text-center text-[13px] font-bold text-neutral-800"
                      style={NUM}
                    >
                      {s.appearances}
                    </Text>
                    <Text
                      className="w-7 text-center text-[13px] font-bold text-primary"
                      style={NUM}
                    >
                      {s.goals}
                    </Text>
                    <Text
                      className="w-7 text-center text-[13px] font-bold text-neutral-800"
                      style={NUM}
                    >
                      {s.assists}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          )}

          {/* ── 골 기록 ── */}
          {summary?.goal_matches && summary.goal_matches.length > 0 && (
            <Card className="p-5">
              <SectionHeader
                title="골 기록"
                trailing={
                  <Text className="text-xs font-bold text-primary" style={NUM}>
                    {totalGoals}골
                  </Text>
                }
              />
              {summary.goal_matches.map((gm, i) => {
                const outcome = getMatchOutcome(gm);
                const scoreText =
                  gm.home_score != null && gm.away_score != null
                    ? gm.is_home
                      ? `${gm.home_score} - ${gm.away_score}`
                      : `${gm.away_score} - ${gm.home_score}`
                    : '-';
                const hasPK = gm.penalty_home_score != null && gm.penalty_away_score != null;

                return (
                  <Pressable
                    key={`${gm.match_id}-${i}`}
                    className={`py-3.5 active:bg-neutral-50 ${i < (summary.goal_matches?.length ?? 0) - 1 ? 'border-b border-neutral-100' : ''}`}
                    onPress={() => router.push(`/matches/${gm.match_id}`)}
                  >
                    {/* 상단: 날짜 + 시즌 + 결과 뱃지 */}
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center" style={{ gap: 6 }}>
                        <Text className="text-[11px] font-medium text-neutral-400" style={NUM}>
                          {gm.match_date ? format(new Date(gm.match_date), 'yy.MM.dd') : '-'}
                        </Text>
                        <View className="h-3 w-px bg-neutral-200" />
                        <Text className="text-[11px] text-neutral-400">
                          {shortenSeasonName(gm.season_name)}
                        </Text>
                      </View>
                      <View className={`rounded-full px-2 py-0.5 ${outcome.color.split(' ')[0]}`}>
                        <Text className={`text-[10px] font-bold ${outcome.color.split(' ')[1]}`}>
                          {outcome.label}
                        </Text>
                      </View>
                    </View>

                    {/* 하단: 상대팀 + 스코어 + 골수 */}
                    <View className="mt-2 flex-row items-center">
                      <Text className="mr-1.5 text-[11px] text-neutral-400">vs</Text>
                      <TeamLogo
                        uri={gm.opponent_logo}
                        size={22}
                        teamName={gm.opponent_name ?? ''}
                      />
                      <Text
                        className="ml-2 flex-1 text-[13px] font-medium text-neutral-700"
                        numberOfLines={1}
                      >
                        {gm.opponent_name}
                      </Text>

                      {/* 스코어 */}
                      <View className="mr-3 items-end">
                        <Text className="text-[13px] font-bold text-neutral-900" style={NUM}>
                          {scoreText}
                        </Text>
                        {hasPK && (
                          <Text className="text-[10px] text-neutral-400" style={NUM}>
                            PK{' '}
                            {gm.is_home
                              ? `${gm.penalty_home_score}-${gm.penalty_away_score}`
                              : `${gm.penalty_away_score}-${gm.penalty_home_score}`}
                          </Text>
                        )}
                      </View>

                      {/* 득점 수 */}
                      <View className="min-w-[40px] items-center rounded-xl bg-primary/10 px-2.5 py-1.5">
                        <Text className="text-[13px] font-bold text-primary" style={NUM}>
                          {gm.player_goals}골
                        </Text>
                        {gm.penalty_goals > 0 && (
                          <Text className="text-[9px] text-primary/60">PK {gm.penalty_goals}</Text>
                        )}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </Card>
          )}
        </View>
      </ScrollView>
    </>
  );
}
