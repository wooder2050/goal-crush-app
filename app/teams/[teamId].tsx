import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Line, Rect } from 'react-native-svg';

import { getPlayersPagePrisma, type PlayersPageItem } from '@/api/players';
import {
  type CoachSeasonRecord,
  getTeamByIdPrisma,
  getTeamCoachRecordsPrisma,
  getTeamFormationPrisma,
  getTeamHighlightsPrisma,
  getTeamRecentFormPrisma,
  getTeamSeasonStandingsPrisma,
  getTeamStatsPrisma,
  getTeamTopPlayersPrisma,
  type TeamPlayerStatRow,
  type TeamRecentMatch,
  type TeamSeasonStandingRow,
  type TeamStats,
} from '@/api/teams';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card } from '@/components/ui/Card';
import { sanitizeLabel } from '@/lib/utils';

const NUM = { fontVariant: ['tabular-nums' as const] };

function isLightColor(hex: string | null | undefined): boolean {
  if (!hex) return true;
  const c = hex.replace('#', '');
  if (c.length < 6) return true;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 186;
}

/* ─── helpers ─── */

type League = 'super' | 'challenge' | 'playoff' | 'cup' | 'g-league' | 'other';

function inferLeague(seasonName: string | null): League {
  if (!seasonName) return 'other';
  const n = seasonName.toLowerCase();
  if (n.includes('슈퍼') || n.includes('super')) return 'super';
  if (n.includes('챌린지') || n.includes('challenge')) return 'challenge';
  if (n.includes('플레이오프') || n.includes('playoff')) return 'playoff';
  if (n.includes('champion') || n.includes('챔피언') || n.includes('sbs') || n.includes('cup') || n.includes('컵')) return 'cup';
  if (n.includes('g리그') || n.includes('g-league') || n.includes('조별')) return 'g-league';
  return 'other';
}


/* ══════════════════════════════════════════════════
   1. TeamHeader — 웹 동일 (팀색 배너 + 통계 그리드 + 우승 + 주요 선수)
   ══════════════════════════════════════════════════ */

function TeamHeaderCard({
  team,
  stats,
  highlights,
  router,
}: {
  team: { team_id: number; team_name: string; logo?: string | null; primary_color?: string | null; secondary_color?: string | null; founded_year?: number | null };
  stats?: TeamStats | null;
  highlights?: Awaited<ReturnType<typeof getTeamHighlightsPrisma>> | null;
  router: ReturnType<typeof useRouter>;
}) {
  const primaryColor = team.primary_color ?? '#1F2937';
  const headerBg = isLightColor(primaryColor)
    ? team.secondary_color && !isLightColor(team.secondary_color) ? team.secondary_color : '#1F2937'
    : primaryColor;
  const light = isLightColor(headerBg);
  const headerText = light ? '#111827' : '#FFFFFF';
  const headerSub = light ? '#4B5563' : 'rgba(255,255,255,0.7)';

  return (
    <Card className="overflow-hidden p-0">
      {/* 팀색 배너 */}
      <View className="flex-row items-center px-5 pb-5 pt-6" style={{ backgroundColor: headerBg, gap: 12, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff', padding: 2, overflow: 'hidden' }}>
          {team.logo ? (
            <Image source={{ uri: team.logo }} style={{ width: 60, height: 60, borderRadius: 30 }} contentFit="cover" />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text style={{ color: headerSub, fontSize: 20, fontWeight: '600' }}>{team.team_name?.charAt(0)}</Text>
            </View>
          )}
        </View>
        <View className="min-w-0 flex-1">
          <Text style={{ color: headerText, fontSize: 22, fontWeight: '600' }} numberOfLines={1}>{team.team_name}</Text>
          <Text style={{ color: headerSub, fontSize: 13, marginTop: 4 }}>
            {team.founded_year ? `${team.founded_year}년 창단` : ''}
          </Text>
        </View>
      </View>

      {/* 통계 그리드 (3행 2열) — 웹 동일 */}
      {stats && (
        <View>
          <View className="flex-row border-t border-neutral-100">
            <View className="flex-1 border-r border-neutral-100 px-5 py-3.5">
              <Text className="text-xl font-medium text-neutral-900" style={NUM}>{stats.matches}</Text>
              <Text className="text-[12px] text-neutral-400">경기</Text>
            </View>
            <View className="flex-1 px-5 py-3.5">
              <Text className="text-xl font-medium text-neutral-900" style={NUM}>{stats.win_rate}%</Text>
              <Text className="text-[12px] text-neutral-400">승률</Text>
            </View>
          </View>
          <View className="flex-row border-t border-neutral-100">
            <View className="flex-1 border-r border-neutral-100 px-5 py-3.5">
              <Text className="text-xl font-medium text-neutral-900" style={NUM}>{stats.wins}</Text>
              <Text className="text-[12px] text-neutral-400">승</Text>
            </View>
            <View className="flex-1 px-5 py-3.5">
              <Text className="text-xl font-medium text-neutral-900" style={NUM}>{stats.losses}</Text>
              <Text className="text-[12px] text-neutral-400">패</Text>
            </View>
          </View>
          <View className="flex-row border-t border-neutral-100">
            <View className="flex-1 border-r border-neutral-100 px-5 py-3.5">
              <Text className="text-xl font-medium text-neutral-900" style={NUM}>{stats.goals_for}</Text>
              <Text className="text-[12px] text-neutral-400">득점</Text>
            </View>
            <View className="flex-1 px-5 py-3.5">
              <Text className="text-xl font-medium text-neutral-900" style={NUM}>{stats.goals_against}</Text>
              <Text className="text-[12px] text-neutral-400">실점</Text>
            </View>
          </View>
        </View>
      )}

      {/* 우승 기록 */}
      {highlights && highlights.championships.count > 0 && (
        <View className="border-t border-neutral-100 px-5 py-3.5">
          <Text className="text-[12px] text-neutral-400">우승 기록</Text>
          <View className="mt-2 flex-row flex-wrap" style={{ gap: 6 }}>
            {highlights.championships.seasons.map((s) => (
              <View key={s.season_id} className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1">
                <Text className="text-[12px] font-medium text-amber-800">🏆 {sanitizeLabel(s.season_name) || `시즌 ${s.year ?? ''}`}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 주요 선수 (최다 출장 + 최다 득점) */}
      {highlights && (highlights.top_appearances || highlights.top_scorer) && (
        <View className="flex-row border-t border-neutral-100">
          {highlights.top_appearances && (
            <Pressable className="flex-1 flex-row items-center border-r border-neutral-100 px-5 py-3.5 active:bg-neutral-50" style={{ gap: 8 }} onPress={() => router.push(`/players/${highlights.top_appearances!.player_id}`)}>
              {highlights.top_appearances.profile_image_url ? (
                <Image source={{ uri: highlights.top_appearances.profile_image_url }} style={{ width: 32, height: 32, borderRadius: 16 }} contentFit="cover" />
              ) : (
                <View className="h-8 w-8 items-center justify-center rounded-full bg-neutral-100">
                  <Text className="text-xs font-medium text-neutral-400">{highlights.top_appearances.name.charAt(0)}</Text>
                </View>
              )}
              <View className="min-w-0 flex-1">
                <Text className="text-sm font-medium text-neutral-900" numberOfLines={1}>{highlights.top_appearances.name}</Text>
                <Text className="text-[11px] text-neutral-400">최다 출장 ({highlights.top_appearances.appearances}경기)</Text>
              </View>
            </Pressable>
          )}
          {highlights.top_scorer && (
            <Pressable className="flex-1 flex-row items-center px-5 py-3.5 active:bg-neutral-50" style={{ gap: 8 }} onPress={() => router.push(`/players/${highlights.top_scorer!.player_id}`)}>
              {highlights.top_scorer.profile_image_url ? (
                <Image source={{ uri: highlights.top_scorer.profile_image_url }} style={{ width: 32, height: 32, borderRadius: 16 }} contentFit="cover" />
              ) : (
                <View className="h-8 w-8 items-center justify-center rounded-full bg-neutral-100">
                  <Text className="text-xs font-medium text-neutral-400">{highlights.top_scorer.name.charAt(0)}</Text>
                </View>
              )}
              <View className="min-w-0 flex-1">
                <Text className="text-sm font-medium text-neutral-900" numberOfLines={1}>{highlights.top_scorer.name}</Text>
                <Text className="text-[11px] text-neutral-400">최다 득점 ({highlights.top_scorer.goals}골)</Text>
              </View>
            </Pressable>
          )}
        </View>
      )}
    </Card>
  );
}

/* ══════════════════════════════════════════════════
   2. FormationCard — 선발 포지션 + 최근 10경기
   ══════════════════════════════════════════════════ */

function FormationSection({
  formation,
  recentForm,
  teamColor,
  teamInfo,
  router,
}: {
  formation: Awaited<ReturnType<typeof getTeamFormationPrisma>> | undefined;
  recentForm: TeamRecentMatch[] | undefined;
  teamColor: string;
  teamInfo: { team_name: string; logo?: string | null };
  router: ReturnType<typeof useRouter>;
}) {
  const hasFormation = formation && formation.positions && formation.positions.length > 0;
  const hasRecentForm = recentForm && recentForm.length > 0;
  if (!hasFormation && !hasRecentForm) return null;

  // 웹과 동일한 좌표
  const POS_COORDS: Record<string, { x: number; y: number }> = {
    FW: { x: 85, y: 45 }, MF: { x: 85, y: 90 }, DF: { x: 85, y: 150 }, GK: { x: 85, y: 205 },
  };

  // 같은 포지션 내 오프셋 (웹과 동일 로직)
  const getOffsetX = (idx: number, count: number): number => {
    if (count === 1) return 0;
    if (count === 2) return idx === 0 ? -25 : 25;
    return (idx - (count - 1) / 2) * 35;
  };

  // 포지션별 그룹
  const grouped = new Map<string, NonNullable<typeof formation>['positions']>();
  if (hasFormation) {
    for (const p of formation!.positions) {
      const arr = grouped.get(p.position) ?? [];
      arr.push(p);
      grouped.set(p.position, arr);
    }
  }

  // 피치 사이즈 (패스맵과 동일한 비율)
  const PITCH_W = 340;
  const PITCH_H = 460;
  const BADGE_R = 28;

  return (
    <Card className="overflow-hidden p-0">
      {/* 포메이션 피치 */}
      {hasFormation && (
        <>
          <View className="px-5 pb-2 pt-4">
            <Text className="text-lg font-medium text-neutral-900">선발 포지션</Text>
            {formation!.season_name && (
              <Text className="text-[12px] text-neutral-400">{sanitizeLabel(formation!.season_name)}</Text>
            )}
          </View>
          <View className="px-4 pb-4">
            <View style={{ aspectRatio: 170 / 230, position: 'relative' }}>
              {/* SVG 피치 배경 (웹 동일: 회색 + 흰색 라인) */}
              <Svg width="100%" height="100%" viewBox={`0 0 ${PITCH_W} ${PITCH_H}`}>
                <Rect x={0} y={0} width={PITCH_W} height={PITCH_H} rx={12} fill="#EFEFEF" />
                <Rect x={10} y={10} width={PITCH_W - 20} height={PITCH_H - 20} fill="none" stroke="#FFFFFF" strokeWidth={1.5} />
                <Line x1={10} y1={PITCH_H / 2} x2={PITCH_W - 10} y2={PITCH_H / 2} stroke="#FFFFFF" strokeWidth={1.5} />
                <Circle cx={PITCH_W / 2} cy={PITCH_H / 2} r={44} fill="none" stroke="#FFFFFF" strokeWidth={1.5} />
                <Circle cx={PITCH_W / 2} cy={PITCH_H / 2} r={3} fill="#FFFFFF" />
                {/* 상단 페널티 */}
                <Rect x={68} y={10} width={204} height={88} fill="none" stroke="#FFFFFF" strokeWidth={1.5} />
                <Rect x={108} y={10} width={124} height={44} fill="none" stroke="#FFFFFF" strokeWidth={1.5} />
                <Circle cx={PITCH_W / 2} cy={80} r={3} fill="#FFFFFF" />
                {/* 하단 페널티 */}
                <Rect x={68} y={PITCH_H - 98} width={204} height={88} fill="none" stroke="#FFFFFF" strokeWidth={1.5} />
                <Rect x={108} y={PITCH_H - 54} width={124} height={44} fill="none" stroke="#FFFFFF" strokeWidth={1.5} />
                <Circle cx={PITCH_W / 2} cy={PITCH_H - 80} r={3} fill="#FFFFFF" />
              </Svg>

              {/* 선수 프로필 이미지 뱃지 (absolute) */}
              {hasFormation && formation!.positions.map((p) => {
                const coord = POS_COORDS[p.position];
                if (!coord) return null;
                const group = grouped.get(p.position) ?? [p];
                const idx = group.indexOf(p);
                const offsetX = getOffsetX(idx, group.length);
                const leftPct = ((coord.x + offsetX) / 170) * 100;
                const topPct = (coord.y / 230) * 100;
                return (
                  <Pressable
                    key={`${p.position}-${p.player_id}`}
                    style={{ position: 'absolute', left: `${leftPct}%`, top: `${topPct}%`, transform: [{ translateX: -BADGE_R }, { translateY: -BADGE_R }], alignItems: 'center', width: BADGE_R * 2 }}
                    onPress={() => router.push(`/players/${p.player_id}`)}
                  >
                    <View style={{ width: BADGE_R * 2, height: BADGE_R * 2, borderRadius: BADGE_R, borderWidth: 2, borderColor: teamColor, backgroundColor: '#fff', overflow: 'hidden' }}>
                      {p.profile_image_url ? (
                        <Image source={{ uri: p.profile_image_url }} style={{ width: BADGE_R * 2 - 4, height: BADGE_R * 2 - 4, borderRadius: BADGE_R - 2 }} contentFit="cover" />
                      ) : (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: teamColor }}>
                          <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{p.name.charAt(0)}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 9, fontWeight: '500', color: '#fff', marginTop: 2, textAlign: 'center' }} numberOfLines={1}>{p.name}</Text>
                    <View style={{ backgroundColor: teamColor, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1, marginTop: 1 }}>
                      <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#fff' }}>{p.position}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </>
      )}

      {/* 최근 10경기 (웹 동일: 시즌+날짜 → 팀로고 스코어 상대로고) */}
      {hasRecentForm && (
        <View className="border-t border-neutral-100 px-4 py-4">
          <View className="mb-3 flex-row items-center justify-between px-2">
            <Text className="text-sm font-medium text-neutral-900">최근 10경기</Text>
            <Text className="text-[12px] text-neutral-400">
              <Text className="font-medium text-emerald-600">{recentForm!.filter((m) => m.result === 'W').length}승</Text>
              <Text> · </Text>
              <Text className="font-medium text-red-600">{recentForm!.filter((m) => m.result === 'L').length}패</Text>
            </Text>
          </View>
          {recentForm!.slice(0, 10).map((m: TeamRecentMatch, i: number) => {
            const date = new Date(m.match_date);
            const dateStr = `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
            const myScore = m.is_home ? m.home_score : m.away_score;
            const opScore = m.is_home ? m.away_score : m.home_score;
            const scoreBg = m.result === 'W' ? '#22C55E' : m.result === 'L' ? '#EF4444' : '#9CA3AF';
            return (
              <Pressable key={`rf-${m.match_id}-${i}`} className="rounded-lg px-2 py-1.5 active:bg-neutral-50" onPress={() => router.push(`/matches/${m.match_id}`)}>
                {/* 시즌 + 날짜 */}
                <View className="mb-1 flex-row items-center justify-between">
                  <Text className="text-[10px] text-neutral-400" numberOfLines={1}>{m.season_name ? sanitizeLabel(m.season_name) : ''}</Text>
                  <Text className="text-[10px] text-neutral-400">{dateStr}</Text>
                </View>
                {/* 팀 로고 - 스코어 - 상대 로고 */}
                <View className="flex-row items-center" style={{ gap: 6 }}>
                  {/* 우리팀 */}
                  <View className="min-w-0 flex-1 flex-row items-center justify-end" style={{ gap: 4 }}>
                    <Text className="text-[11px] font-medium text-neutral-700" numberOfLines={1}>{teamInfo.team_name}</Text>
                    {teamInfo.logo ? (
                      <Image source={{ uri: teamInfo.logo }} style={{ width: 20, height: 20, borderRadius: 10 }} contentFit="cover" />
                    ) : (
                      <View className="h-5 w-5 items-center justify-center rounded-full bg-neutral-200">
                        <Text className="text-[8px] text-neutral-500">{teamInfo.team_name.charAt(0)}</Text>
                      </View>
                    )}
                  </View>
                  {/* 스코어 */}
                  <View className="items-center justify-center rounded-md px-2.5 py-1" style={{ backgroundColor: scoreBg, minWidth: 48 }}>
                    <Text className="text-[12px] font-bold text-white" style={NUM}>{myScore ?? 0} - {opScore ?? 0}</Text>
                  </View>
                  {/* 상대팀 */}
                  <View className="min-w-0 flex-1 flex-row items-center" style={{ gap: 4 }}>
                    {m.opponent_logo ? (
                      <Image source={{ uri: m.opponent_logo }} style={{ width: 20, height: 20, borderRadius: 10 }} contentFit="cover" />
                    ) : (
                      <View className="h-5 w-5 items-center justify-center rounded-full bg-neutral-200">
                        <Text className="text-[8px] text-neutral-500">{m.opponent_name.charAt(0)}</Text>
                      </View>
                    )}
                    <Text className="text-[11px] font-medium text-neutral-700" numberOfLines={1}>{m.opponent_name}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </Card>
  );
}

/* ══════════════════════════════════════════════════
   3. TopPlayersCard — 득점/도움/평점 탭
   ══════════════════════════════════════════════════ */

function TopPlayersSection({
  data,
  teamColor,
  teamSecondaryColor,
  router,
}: {
  data: { topScorers: TeamPlayerStatRow[]; topAssists: TeamPlayerStatRow[]; topRated: TeamPlayerStatRow[] } | undefined;
  teamColor: string;
  teamSecondaryColor: string;
  router: ReturnType<typeof useRouter>;
}) {
  const [tab, setTab] = useState<'scorers' | 'assists' | 'rated'>('scorers');
  if (!data || (data.topScorers.length === 0 && data.topAssists.length === 0 && data.topRated.length === 0)) return null;

  const list = tab === 'scorers' ? data.topScorers : tab === 'assists' ? data.topAssists : data.topRated;

  return (
    <Card className="p-5">
      <View className="mb-3 flex-row items-center">
        <View className="mr-2 h-4 w-1 rounded-full bg-primary" />
        <Text className="text-base font-bold text-neutral-800">선수 순위</Text>
      </View>
      <View className="mb-3 flex-row rounded-lg bg-neutral-100 p-0.5">
        {([['scorers', '득점'], ['assists', '도움'], ['rated', '평점']] as const).map(([key, label]) => (
          <Pressable key={key} className={`flex-1 items-center rounded-md py-1.5 ${tab === key ? 'bg-white' : ''}`} onPress={() => setTab(key)}>
            <Text className={`text-xs font-bold ${tab === key ? 'text-neutral-800' : 'text-neutral-400'}`}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {list.slice(0, 5).map((p, i) => (
        <Pressable key={p.player_id} className={`flex-row items-center py-2.5 active:bg-neutral-50 ${i < Math.min(list.length, 5) - 1 ? 'border-b border-neutral-50' : ''}`} onPress={() => router.push(`/players/${p.player_id}`)}>
          <View className={`h-5 w-5 items-center justify-center rounded-full ${i === 0 ? 'bg-primary/10' : ''}`}>
            <Text className={`text-[10px] font-bold ${i === 0 ? 'text-primary' : 'text-neutral-400'}`}>{i + 1}</Text>
          </View>
          {p.profile_image_url ? (
            <Image source={{ uri: p.profile_image_url }} style={{ width: 32, height: 32, borderRadius: 16, marginLeft: 6 }} contentFit="cover" />
          ) : (
            <View className="ml-1.5 h-8 w-8 items-center justify-center rounded-full bg-neutral-100">
              <Text className="text-[10px] font-bold text-neutral-400">{p.name.charAt(0)}</Text>
            </View>
          )}
          <Text className="ml-2 flex-1 text-sm font-medium text-neutral-700" numberOfLines={1}>{p.name}</Text>
          {i === 0 ? (
            <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: teamColor }}>
              <Text className="text-xs font-bold" style={{ color: teamSecondaryColor, ...NUM }}>{tab === 'rated' ? p.value.toFixed(1) : p.value}</Text>
            </View>
          ) : (
            <Text className="text-sm font-bold text-neutral-700" style={NUM}>{tab === 'rated' ? p.value.toFixed(1) : p.value}</Text>
          )}
        </Pressable>
      ))}
    </Card>
  );
}

/* ══════════════════════════════════════════════════
   4. CoachStatsCard — 감독 시즌별 성적
   ══════════════════════════════════════════════════ */

function CoachStatsSection({ records, teamColor }: { records: CoachSeasonRecord[] | undefined; teamColor: string }) {
  const VISIBLE = 3;
  const CHART_H = 140;
  const [startIdx, setStartIdx] = useState(0);
  const maxStart = Math.max((records?.length ?? 0) - VISIBLE, 0);
  if (startIdx === 0 && maxStart > 0 && records && records.length > VISIBLE) setStartIdx(maxStart);

  if (!records || records.length === 0) return null;

  const visible = records.slice(startIdx, startIdx + VISIBLE);
  const canPrev = startIdx > 0;
  const canNext = startIdx + VISIBLE < records.length;

  const getTop = (winRate: number) => {
    const range = CHART_H - 10 - 55;
    return 10 + range * (1 - winRate / 100);
  };

  return (
    <Card className="overflow-hidden p-0">
      <View className="px-5 pb-2 pt-4">
        <Text className="text-lg font-medium text-neutral-900">감독 승률</Text>
        <Text className="text-[12px] text-neutral-400">경기당 승점</Text>
      </View>

      {/* 가로 차트 + 하단 프로필 (동일 패딩으로 정렬) */}
      <View className="relative px-5">
        {/* 좌우 화살표 */}
        {canPrev && (
          <Pressable
            style={{ position: 'absolute', left: 4, top: CHART_H / 2 - 14, zIndex: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 3, alignItems: 'center', justifyContent: 'center' }}
            onPress={() => setStartIdx((s) => Math.max(s - 1, 0))}
          >
            <ChevronRight size={14} color="#666" style={{ transform: [{ rotate: '180deg' }] }} />
          </Pressable>
        )}
        {canNext && (
          <Pressable
            style={{ position: 'absolute', right: 4, top: CHART_H / 2 - 14, zIndex: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 3, alignItems: 'center', justifyContent: 'center' }}
            onPress={() => setStartIdx((s) => Math.min(s + 1, records.length - VISIBLE))}
          >
            <ChevronRight size={14} color="#666" />
          </Pressable>
        )}

        {/* 차트 영역 */}
        <View className="overflow-hidden rounded-xl bg-neutral-50" style={{ height: CHART_H }}>
          <View className="flex-1 flex-row">
            {visible.map((r, i) => {
              const top = getTop(r.win_rate);
              const barH = Math.max(CHART_H - top - 60, 0);
              return (
                <View key={`${r.season_name}-${r.coach_id}-${i}`} className="flex-1 items-center" style={{ position: 'relative', height: CHART_H }}>
                  <View style={{ position: 'absolute', top, alignItems: 'center' }}>
                    <View style={{ backgroundColor: teamColor, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold', ...NUM }}>{r.win_rate}%</Text>
                    </View>
                    <View style={{ backgroundColor: '#fff', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginTop: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 }}>
                      <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '500', ...NUM }}>{r.ppg} 승점</Text>
                    </View>
                  </View>
                  <View style={{ position: 'absolute', bottom: 0, width: 2, height: barH, backgroundColor: teamColor, opacity: 0.3, borderRadius: 1, alignSelf: 'center' }} />
                </View>
              );
            })}
          </View>
        </View>

        {/* 하단 감독 프로필 (차트와 동일 컨테이너 안에서 flex-row) */}
        <View className="flex-row py-3">
          {visible.map((r, i) => (
            <View key={`cp-${r.season_name}-${r.coach_id}-${i}`} className="flex-1 items-center">
              {r.profile_image_url ? (
                <Image source={{ uri: r.profile_image_url }} style={{ width: 44, height: 44, borderRadius: 22 }} contentFit="cover" contentPosition="top" />
              ) : (
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: '500', color: '#9CA3AF' }}>{r.coach_name.charAt(0)}</Text>
                </View>
              )}
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151', marginTop: 4, textAlign: 'center' }} numberOfLines={1}>{r.coach_name}</Text>
              <Text style={{ fontSize: 10, color: '#9CA3AF', textAlign: 'center' }} numberOfLines={1}>{sanitizeLabel(r.season_name)}</Text>
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}

/* ══════════════════════════════════════════════════
   5. SquadSection — 선수단
   ══════════════════════════════════════════════════ */

function SquadSection({ players, router, teamColor, topAppearancesId, topScorerId, topAssistsId }: {
  players: PlayersPageItem[]; router: ReturnType<typeof useRouter>; teamColor: string;
  topAppearancesId?: number | null; topScorerId?: number | null; topAssistsId?: number | null;
}) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? players : players.slice(0, 8);
  const POS_COLORS: Record<string, { bg: string; text: string }> = {
    FW: { bg: 'bg-red-50', text: 'text-red-600' }, MF: { bg: 'bg-green-50', text: 'text-green-600' },
    DF: { bg: 'bg-blue-50', text: 'text-blue-600' }, GK: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
  };
  const hlStyle = { backgroundColor: teamColor, borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2, minWidth: 28, alignItems: 'center' as const };

  return (
    <Card className="p-5">
      <View className="mb-3 flex-row items-center">
        <View className="mr-2 h-4 w-1 rounded-full bg-primary" />
        <Text className="text-base font-bold text-neutral-800">선수단</Text>
        <Text className="ml-auto text-xs text-neutral-400">{players.length}명</Text>
      </View>
      <View className="mb-1 flex-row items-center border-b border-neutral-100 pb-1.5">
        <View className="flex-1" />
        <View className="flex-row" style={{ gap: 8 }}>
          <Text className="w-7 text-center text-[9px] font-medium text-neutral-400">출전</Text>
          <Text className="w-7 text-center text-[9px] font-medium text-neutral-400">골</Text>
          <Text className="w-7 text-center text-[9px] font-medium text-neutral-400">도움</Text>
        </View>
      </View>
      {displayed.map((p, i) => {
        const pos = p.position?.split('/')[0] ?? '';
        const pc = POS_COLORS[pos];
        const isTopApp = p.player_id === topAppearancesId;
        const isTopGoal = p.player_id === topScorerId && p.totals.goals > 0;
        const isTopAssist = p.player_id === topAssistsId && p.totals.assists > 0;
        return (
          <Pressable key={p.player_id} className={`flex-row items-center py-2.5 active:bg-neutral-50 ${i < displayed.length - 1 ? 'border-b border-neutral-50' : ''}`} onPress={() => router.push(`/players/${p.player_id}`)}>
            {p.profile_image_url ? (
              <Image source={{ uri: p.profile_image_url }} style={{ width: 28, height: 28, borderRadius: 14 }} contentFit="cover" />
            ) : (
              <View className="h-7 w-7 items-center justify-center rounded-full bg-neutral-100">
                <Text className="text-[10px] font-bold text-neutral-400">{p.name.charAt(0)}</Text>
              </View>
            )}
            <View className="ml-2 min-w-0 flex-1">
              <View className="flex-row items-center" style={{ gap: 4 }}>
                <Text className="text-sm font-medium text-neutral-800" numberOfLines={1}>{p.name}</Text>
                {pc && <View className={`rounded px-1 py-px ${pc.bg}`}><Text className={`text-[8px] font-bold ${pc.text}`}>{pos}</Text></View>}
              </View>
              {p.jersey_number != null && <Text className="text-[10px] text-neutral-400">#{p.jersey_number}</Text>}
            </View>
            <View className="flex-row" style={{ gap: 8 }}>
              {isTopApp ? (
                <View style={hlStyle}><Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold', ...NUM }}>{p.totals.appearances}</Text></View>
              ) : (
                <Text className="w-7 text-center text-[12px] font-bold text-neutral-700" style={NUM}>{p.totals.appearances}</Text>
              )}
              {isTopGoal ? (
                <View style={hlStyle}><Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold', ...NUM }}>{p.totals.goals}</Text></View>
              ) : (
                <Text className="w-7 text-center text-[12px] font-bold text-primary" style={NUM}>{p.totals.goals}</Text>
              )}
              {isTopAssist ? (
                <View style={hlStyle}><Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold', ...NUM }}>{p.totals.assists}</Text></View>
              ) : (
                <Text className="w-7 text-center text-[12px] font-bold text-neutral-700" style={NUM}>{p.totals.assists}</Text>
              )}
            </View>
          </Pressable>
        );
      })}
      {players.length > 8 && (
        <Pressable className="mt-3 flex-row items-center justify-center rounded-xl bg-neutral-50 py-2.5 active:bg-neutral-100" onPress={() => setShowAll(!showAll)}>
          <Text className="text-[13px] font-semibold text-neutral-500">{showAll ? '접기' : `전체 ${players.length}명 보기`}</Text>
          <ChevronRight size={14} color="#a3a3a3" style={{ marginLeft: 2 }} />
        </Pressable>
      )}
    </Card>
  );
}

/* ══════════════════════════════════════════════════
   6. SeasonStandingsSection — 시즌별 순위
   ══════════════════════════════════════════════════ */

function getSeasonOutcome(league: League, position: number | null, seasonName: string | null, category?: string | null, isSeasonEnded?: boolean): { label: string; emoji: string; bg: string; text: string } | null {
  if (!isSeasonEnded) return null;
  if (!position) return null;

  if (category === 'GIFA_CUP' && position === 1) return { label: '우승', emoji: '🏆', bg: 'bg-white border-2 border-primary', text: 'text-primary' };

  const isChamp = typeof seasonName === 'string' && (seasonName.toLowerCase().includes('champion') || seasonName.includes('챔피언'));
  if (isChamp && position === 1) return { label: '우승', emoji: '🏆', bg: 'bg-white border-2 border-primary', text: 'text-primary' };

  if (league === 'super' && position === 1) return { label: '우승', emoji: '🏆', bg: 'bg-white border-2 border-primary', text: 'text-primary' };
  if (league === 'super' && position === 6) return { label: '강등', emoji: '⬇️', bg: 'bg-red-100', text: 'text-red-800' };
  if (league === 'super' && position === 5) return { label: '승강PO', emoji: '↕️', bg: 'bg-blue-100', text: 'text-blue-800' };
  if (league === 'challenge' && position === 1) return { label: '승격', emoji: '⬆️', bg: 'bg-green-100', text: 'text-green-800' };
  if (league === 'challenge' && position === 2) return { label: '승강PO', emoji: '↕️', bg: 'bg-blue-100', text: 'text-blue-800' };
  if (league === 'cup' && position === 1) return { label: '우승', emoji: '🏆', bg: 'bg-white border-2 border-primary', text: 'text-primary' };
  if (league === 'g-league' && position === 1) return { label: '우승', emoji: '🏆', bg: 'bg-white border-2 border-primary', text: 'text-primary' };
  if (league === 'playoff' && position === 1) return { label: '슈퍼행', emoji: '⬆️', bg: 'bg-violet-100', text: 'text-violet-800' };
  if (league === 'playoff' && position === 2) return { label: '챌린지행', emoji: '➡️', bg: 'bg-indigo-100', text: 'text-indigo-800' };

  return null;
}

const LEAGUE_BADGE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  super: { bg: 'bg-violet-100', text: 'text-violet-700', label: '슈퍼' },
  challenge: { bg: 'bg-sky-100', text: 'text-sky-700', label: '챌린지' },
  playoff: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: '플레이오프' },
  cup: { bg: 'bg-orange-100', text: 'text-orange-700', label: '컵' },
  'g-league': { bg: 'bg-teal-100', text: 'text-teal-700', label: 'G리그' },
  other: { bg: 'bg-neutral-100', text: 'text-neutral-600', label: '기타' },
};

function getPositionBadge(pos: number): { medal: string | null; bg: string; text: string } {
  if (pos === 1) return { medal: '🥇', bg: 'bg-amber-50', text: 'text-amber-800' };
  if (pos === 2) return { medal: '🥈', bg: 'bg-neutral-100', text: 'text-neutral-700' };
  if (pos === 3) return { medal: '🥉', bg: 'bg-orange-50', text: 'text-orange-800' };
  return { medal: null, bg: 'bg-neutral-50', text: 'text-neutral-600' };
}

function SeasonStandingsSection({ standings }: { standings: TeamSeasonStandingRow[] }) {
  const rows = standings.filter((r) => r.participated);
  return (
    <Card className="overflow-hidden p-0">
      <View className="px-5 pt-4 pb-2">
        <Text className="text-lg font-medium text-neutral-900">시즌별 순위</Text>
      </View>
      {/* 헤더 */}
      <View className="flex-row items-center border-b border-neutral-100 px-4 pb-2">
        <Text className="w-10 text-[10px] font-medium text-neutral-400">연도</Text>
        <Text className="flex-1 text-[10px] font-medium text-neutral-400">시즌</Text>
        <Text className="w-14 text-center text-[10px] font-medium text-neutral-400">리그</Text>
        <Text className="w-12 text-center text-[10px] font-medium text-neutral-400">순위</Text>
        <Text className="w-8 text-center text-[10px] font-medium text-neutral-400">승점</Text>
        <Text className="w-16 text-center text-[10px] font-medium text-neutral-400">결과</Text>
      </View>
      {/* 행 */}
      <View className="px-4 pb-4">
        {rows.map((row, i) => {
          const league = inferLeague(row.season_name);
          const lb = LEAGUE_BADGE_STYLES[league] ?? LEAGUE_BADGE_STYLES.other;
          const pb = row.position ? getPositionBadge(row.position) : null;
          const outcome = getSeasonOutcome(league, row.position, row.season_name, row.category, row.isSeasonEnded);
          return (
            <View key={`${row.season_id}-${row.league}-${i}`} className={`flex-row items-center py-2.5 ${i < rows.length - 1 ? 'border-b border-neutral-50' : ''}`}>
              {/* 연도 */}
              <Text className="w-10 text-[12px] font-medium text-neutral-700" style={NUM}>{row.year}</Text>
              {/* 시즌 */}
              <Text className="flex-1 text-[11px] font-medium text-neutral-900" numberOfLines={1}>{sanitizeLabel(row.season_name)}</Text>
              {/* 리그 뱃지 */}
              <View className="w-14 items-center">
                <View className={`rounded px-1.5 py-0.5 ${lb.bg}`}>
                  <Text className={`text-[10px] font-semibold ${lb.text}`}>{lb.label}</Text>
                </View>
              </View>
              {/* 순위 뱃지 */}
              <View className="w-12 items-center">
                {pb ? (
                  <View className={`rounded px-1.5 py-0.5 ${pb.bg}`}>
                    <Text className={`text-[10px] font-semibold ${pb.text}`}>{pb.medal ? `${pb.medal} ${row.position}위` : `${row.position}위`}</Text>
                  </View>
                ) : (
                  <Text className="text-[10px] text-neutral-400">-</Text>
                )}
              </View>
              {/* 승점 */}
              <Text className="w-8 text-center text-[12px] font-medium text-neutral-700" style={NUM}>{row.points}</Text>
              {/* 결과 */}
              <View className="w-16 items-center">
                {outcome ? (
                  <View className={`rounded-full px-1.5 py-0.5 ${outcome.bg}`}>
                    <Text className={`text-[9px] font-semibold ${outcome.text}`}>{outcome.emoji} {outcome.label}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

/* ══════════════════════════════════════════════════
   메인 화면
   ══════════════════════════════════════════════════ */

export default function TeamDetailScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const id = Number(teamId);
  const router = useRouter();

  const { data: team, isLoading: teamLoading, isError: teamError, refetch: refetchTeam } = useQuery({ queryKey: ['teamById', id], queryFn: () => getTeamByIdPrisma(id) });
  const { data: stats } = useQuery({ queryKey: ['teamStats', id], queryFn: () => getTeamStatsPrisma(id) });
  const { data: highlights } = useQuery({ queryKey: ['teamHighlights', id], queryFn: () => getTeamHighlightsPrisma(id) });
  const { data: playersData } = useQuery({ queryKey: ['teamPlayersPage', id], queryFn: () => getPlayersPagePrisma(1, 200, { teamId: id, order: 'apps' }) });
  const { data: standings } = useQuery({ queryKey: ['teamSeasonStandings', id], queryFn: () => getTeamSeasonStandingsPrisma(id) });
  const { data: formation } = useQuery({ queryKey: ['teamFormation', id], queryFn: () => getTeamFormationPrisma(id) });
  const { data: recentForm } = useQuery({ queryKey: ['teamRecentForm', id], queryFn: () => getTeamRecentFormPrisma(id, 10) });
  const { data: topPlayersData } = useQuery({ queryKey: ['teamTopPlayers', id], queryFn: () => getTeamTopPlayersPrisma(id) });
  const { data: coachRecords } = useQuery({ queryKey: ['teamCoachRecords', id], queryFn: () => getTeamCoachRecordsPrisma(id) });

  if (teamLoading) return <LoadingSpinner />;
  if (teamError || !team) return <ErrorState onRetry={() => refetchTeam()} />;

  const teamColor = isLightColor(team.primary_color)
    ? team.secondary_color && !isLightColor(team.secondary_color) ? team.secondary_color : '#3B82F6'
    : team.primary_color || '#3B82F6';
  const teamSecondaryColor = team.secondary_color ?? '#FFFFFF';
  const players = playersData?.items;

  return (
    <>
      <Stack.Screen options={{ title: team.team_name, headerShown: true, headerStyle: { backgroundColor: '#fff' }, headerShadowVisible: false }} />
      <ScrollView className="flex-1 bg-neutral-50" refreshControl={<RefreshControl refreshing={false} onRefresh={() => refetchTeam()} tintColor="#ff4800" />} showsVerticalScrollIndicator={false}>
        <View className="px-4 pb-12 pt-4" style={{ gap: 16 }}>
          {/* 1. Header (웹: order-1) */}
          <TeamHeaderCard team={team} stats={stats} highlights={highlights} router={router} />

          {/* 2. Formation + Recent Form (웹: order-2) */}
          <FormationSection formation={formation} recentForm={recentForm} teamColor={teamColor} teamInfo={{ team_name: team.team_name, logo: team.logo }} router={router} />

          {/* 3. Top Players (웹: order-2) */}
          <TopPlayersSection data={topPlayersData} teamColor={teamColor} teamSecondaryColor={teamSecondaryColor} router={router} />

          {/* 4. Coach Stats (웹: order-3) */}
          <CoachStatsSection records={coachRecords} teamColor={teamColor} />

          {/* 5. Squad (웹: order-3) */}
          {players && players.length > 0 && (
            <SquadSection
              players={players}
              router={router}
              teamColor={teamColor}
              topAppearancesId={highlights?.top_appearances?.player_id}
              topScorerId={highlights?.top_scorer?.player_id}
              topAssistsId={topPlayersData?.topAssists?.[0]?.player_id}
            />
          )}

          {/* 6. Season Standings (웹: order-3) */}
          {standings && standings.length > 0 && <SeasonStandingsSection standings={standings} />}

          {/* 7. About (웹: order-3) */}
          {(team.about || team.description) && (
            <Card className="p-5">
              <View className="mb-3 flex-row items-center">
                <View className="mr-2 h-4 w-1 rounded-full bg-primary" />
                <Text className="text-base font-bold text-neutral-800">About</Text>
              </View>
              <Text className="text-[13px] leading-5 text-neutral-600">{sanitizeLabel(team.about || team.description)}</Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </>
  );
}
