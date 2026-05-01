import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { BarChart3, Trophy } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Rect, Text as SvgText } from 'react-native-svg';

import {
  getPlayerByIdPrisma,
  getPlayerGoalkeeperStats,
  getPlayerIndividualAwards,
  getPlayerSummaryPrisma,
  getPlayerTrophies,
} from '@/api/players';
import type { PlayerCurrentSeasonStats, PlayerMatchLogEntry, StatItem } from '@/api/stats';
import {
  getPlayerAssistLog,
  getPlayerCurrentSeason,
  getPlayerDetailedStats,
  getPlayerMatchLog,
  getPlayerPassMap,
  getPlayerTraits,
} from '@/api/stats';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TeamLogo } from '@/components/TeamLogo';
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

/* ── 공통 헬퍼 ── */

function SectionHeader({ title, trailing }: { title: string; trailing?: React.ReactNode }) {
  return (
    <View className="mb-3 flex-row items-center">
      <View className="mr-2 h-4 w-1 rounded-full bg-primary" />
      <Text className="text-base font-bold text-neutral-800">{title}</Text>
      {trailing && <View className="ml-auto">{trailing}</View>}
    </View>
  );
}

function shortenSeason(name: string | null): string {
  return sanitizeLabel(name) || '-';
}

const POS_LABELS: Record<string, string> = {
  FW: '공격수',
  MF: '미드필더',
  DF: '수비수',
  GK: '골키퍼',
};

/* ── 선수 헤더 카드 (웹 동일: 팀색 배너 + 정보 그리드) ── */

function PlayerHeaderCard({
  player,
  summary,
  teamHistory,
  rawTeamHistory,
}: {
  player: { name: string; profile_image_url?: string | null; jersey_number?: number | null };
  summary:
    | {
        totals: { goals: number; assists: number; appearances: number; goals_conceded: number };
        seasons: Array<{ penalty_goals: number }>;
        positions_frequency?: Array<{ position: string; matches: number }>;
        primary_position?: string | null;
      }
    | undefined;
  teamHistory: Array<{ team_name: string | null; logo: string | null }>;
  rawTeamHistory:
    | Array<{ primary_color?: string | null; secondary_color?: string | null }>
    | undefined;
}) {
  const rawTeam = rawTeamHistory?.[0];
  const primaryColor = rawTeam?.primary_color ?? '#1F2937';
  const headerBg = isLightColor(primaryColor)
    ? rawTeam?.secondary_color && !isLightColor(rawTeam.secondary_color)
      ? rawTeam.secondary_color
      : '#1F2937'
    : primaryColor;
  const light = isLightColor(headerBg);
  const headerText = light ? '#111827' : '#FFFFFF';
  const headerSub = light ? '#4B5563' : 'rgba(255,255,255,0.7)';
  const activeTeam = teamHistory[0];
  const positions = summary?.positions_frequency ?? [];
  const primaryPos = positions[0]?.position ?? summary?.primary_position ?? null;
  const seasonCount = summary?.seasons?.length ?? 0;
  const totalPenaltyGoals =
    summary?.seasons?.reduce((s, ss) => s + (ss.penalty_goals ?? 0), 0) ?? 0;
  const teamAccent = isLightColor(headerBg) ? '#3B82F6' : headerBg;

  return (
    <Card className="overflow-hidden p-0">
      <View
        className="flex-row items-center px-5 pb-5 pt-6"
        style={{
          backgroundColor: headerBg,
          gap: 12,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            borderWidth: 2,
            borderColor: headerSub,
            overflow: 'hidden',
          }}
        >
          {player.profile_image_url ? (
            <Image
              source={{ uri: player.profile_image_url }}
              style={{ width: 60, height: 60, borderRadius: 30 }}
              contentFit="cover"
            />
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.1)',
              }}
            >
              <Text style={{ color: headerSub, fontSize: 20, fontWeight: '500' }}>
                {player.name?.charAt(0)}
              </Text>
            </View>
          )}
        </View>
        <View className="min-w-0 flex-1">
          <Text style={{ color: headerText, fontSize: 22, fontWeight: '500' }} numberOfLines={1}>
            {player.name}
          </Text>
          <View className="mt-1.5 flex-row items-center" style={{ gap: 4 }}>
            {activeTeam?.logo && (
              <Image
                source={{ uri: activeTeam.logo }}
                style={{ width: 16, height: 16, borderRadius: 8 }}
                contentFit="cover"
              />
            )}
            <Text style={{ color: headerSub, fontSize: 13 }} numberOfLines={1}>
              {activeTeam?.team_name ?? '-'}
            </Text>
          </View>
        </View>
      </View>

      {summary && (
        <View>
          <View className="flex-row border-t border-neutral-100">
            <View className="flex-1 border-r border-neutral-100 px-5 py-3.5">
              <Text className="text-base text-neutral-900">{player.jersey_number ?? '-'}</Text>
              <Text className="text-[12px] text-neutral-400">등번호</Text>
            </View>
            <View className="flex-1 px-5 py-3.5">
              <Text className="text-base text-neutral-900">{primaryPos ?? '-'}</Text>
              <Text className="text-[12px] text-neutral-400">포지션</Text>
            </View>
          </View>
          <View className="flex-row border-t border-neutral-100">
            <View className="flex-1 border-r border-neutral-100 px-5 py-3.5">
              <Text className="text-base text-neutral-900" style={NUM}>
                {summary.totals.goals}
                {totalPenaltyGoals > 0 && (
                  <Text className="text-[10px] text-neutral-400"> ({totalPenaltyGoals})</Text>
                )}
              </Text>
              <Text className="text-[12px] text-neutral-400">득점</Text>
            </View>
            <View className="flex-1 px-5 py-3.5">
              <Text className="text-base text-neutral-900" style={NUM}>
                {summary.totals.assists}
              </Text>
              <Text className="text-[12px] text-neutral-400">어시스트</Text>
            </View>
          </View>
          <View className="flex-row border-t border-neutral-100">
            <View className="flex-1 border-r border-neutral-100 px-5 py-3.5">
              <Text className="text-base text-neutral-900" style={NUM}>
                {seasonCount}
              </Text>
              <Text className="text-[12px] text-neutral-400">시즌</Text>
            </View>
            <View className="flex-1 px-5 py-3.5">
              <Text className="text-base text-neutral-900" style={NUM}>
                {summary.totals.appearances}
              </Text>
              <Text className="text-[12px] text-neutral-400">경기</Text>
            </View>
          </View>
          {(summary.totals.goals_conceded ?? 0) > 0 && (
            <View className="flex-row border-t border-neutral-100">
              <View className="flex-1 border-r border-neutral-100 px-5 py-3.5">
                <Text className="text-base text-neutral-900" style={NUM}>
                  {summary.totals.goals_conceded}
                </Text>
                <Text className="text-[12px] text-neutral-400">실점</Text>
              </View>
              <View className="flex-1" />
            </View>
          )}

          {/* 포지션 피치 + 기본/기타 */}
          {positions.length > 0 && (
            <View className="flex-row border-t border-neutral-100">
              <View className="flex-1 px-5 py-4">
                <Text className="text-base font-medium text-neutral-900">포지션</Text>
                <Text className="mt-2 text-sm font-medium" style={{ color: teamAccent }}>
                  기본
                </Text>
                <Text className="text-sm text-neutral-900">
                  {POS_LABELS[positions[0].position] ?? positions[0].position}
                </Text>
                {positions.length > 1 && (
                  <>
                    <Text className="mt-2 text-[13px] text-neutral-400">기타</Text>
                    <Text className="text-sm text-neutral-900">
                      {positions
                        .slice(1)
                        .map((p) => POS_LABELS[p.position] ?? p.position)
                        .join(', ')}
                    </Text>
                  </>
                )}
              </View>
              <View className="w-[100px] items-center justify-center border-l border-neutral-100 py-3">
                <Svg width={80} height={108} viewBox="0 0 170 230">
                  <Rect x={0} y={0} width={170} height={230} rx={8} fill="#EFEFEF" />
                  <Rect
                    x={10}
                    y={10}
                    width={150}
                    height={210}
                    fill="none"
                    stroke="#fff"
                    strokeWidth={1.5}
                  />
                  <Line x1={10} y1={115} x2={160} y2={115} stroke="#fff" strokeWidth={1.5} />
                  <Circle cx={85} cy={115} r={22} fill="none" stroke="#fff" strokeWidth={1.5} />
                  <Rect
                    x={34}
                    y={10}
                    width={102}
                    height={44}
                    fill="none"
                    stroke="#fff"
                    strokeWidth={1.5}
                  />
                  <Rect
                    x={34}
                    y={176}
                    width={102}
                    height={44}
                    fill="none"
                    stroke="#fff"
                    strokeWidth={1.5}
                  />
                  {[
                    { pos: 'FW', y: 45 },
                    { pos: 'MF', y: 90 },
                    { pos: 'DF', y: 150 },
                    { pos: 'GK', y: 205 },
                  ].map(({ pos, y }) => {
                    const active = positions.some((p) => p.position === pos);
                    return (
                      <React.Fragment key={pos}>
                        <Circle
                          cx={85}
                          cy={y}
                          r={16}
                          fill={active ? teamAccent : '#d4d4d4'}
                          opacity={active ? 0.9 : 0.3}
                        />
                        <SvgText
                          x={85}
                          y={y + 4}
                          textAnchor="middle"
                          fontSize={10}
                          fontWeight="bold"
                          fill="#fff"
                        >
                          {pos}
                        </SvgText>
                      </React.Fragment>
                    );
                  })}
                </Svg>
              </View>
            </View>
          )}
        </View>
      )}
    </Card>
  );
}

/* ── 경력 카드 (웹 CareerCard: 클럽/시즌 탭) ── */

function CareerCard({
  teamHistory,
  seasons,
  router,
}: {
  teamHistory: Array<{
    team_id: number | null;
    team_name: string | null;
    logo: string | null;
    start_date: string | null;
    end_date: string | null;
    is_active: boolean;
  }>;
  seasons:
    | Array<{
        season_id: number | null;
        season_name: string | null;
        team_id: number | null;
        team_name: string | null;
        team_logo: string | null;
        goals: number;
        assists: number;
        appearances: number;
        penalty_goals: number;
        positions: string[];
      }>
    | undefined;
  router: ReturnType<typeof useRouter>;
}) {
  const [tab, setTab] = useState<'club' | 'season'>('club');
  const [clubExpanded, setClubExpanded] = useState(false);
  const [seasonExpanded, setSeasonExpanded] = useState(false);

  if (teamHistory.length === 0 && (!seasons || seasons.length === 0)) return null;

  const clubList = teamHistory;
  const seasonList = seasons ? [...seasons].reverse() : [];
  const visibleClubs = clubExpanded ? clubList : clubList.slice(0, 5);
  const visibleSeasons = seasonExpanded ? seasonList : seasonList.slice(0, 5);

  return (
    <Card className="overflow-hidden p-0">
      <View className="px-5 pt-4 pb-2">
        <Text className="text-lg font-medium text-neutral-900">경력</Text>
      </View>
      <View className="flex-row border-b border-neutral-100 px-5">
        <Pressable className="mr-5 pb-3" onPress={() => setTab('club')}>
          <Text
            className={`text-sm font-medium ${tab === 'club' ? 'text-neutral-900' : 'text-neutral-400'}`}
          >
            클럽
          </Text>
          {tab === 'club' && <View className="mt-1 h-[2px] w-8 rounded-full bg-emerald-500" />}
        </Pressable>
        <Pressable className="pb-3" onPress={() => setTab('season')}>
          <Text
            className={`text-sm font-medium ${tab === 'season' ? 'text-neutral-900' : 'text-neutral-400'}`}
          >
            시즌
          </Text>
          {tab === 'season' && <View className="mt-1 h-[2px] w-8 rounded-full bg-emerald-500" />}
        </Pressable>
      </View>
      <View className="px-4 py-3">
        {tab === 'club' && (
          <>
            <View className="mb-2 flex-row items-center justify-end px-2">
              <Text className="w-9 text-right text-[10px] text-neutral-400">경기</Text>
              <Text className="w-9 text-right text-[10px] text-neutral-400">골</Text>
            </View>
            {visibleClubs.map((t, i) => {
              const startStr = t.start_date ? format(new Date(t.start_date), 'yyyy.MM') : null;
              const endStr = t.is_active
                ? '현재'
                : t.end_date
                  ? format(new Date(t.end_date), 'yyyy.MM')
                  : null;
              const dateRange = startStr ? `${startStr} ~ ${endStr ?? ''}` : null;
              const clubSeasons = seasons?.filter((s) => s.team_name === t.team_name) ?? [];
              const totalApps = clubSeasons.reduce((s, ss) => s + ss.appearances, 0);
              const totalGoals = clubSeasons.reduce((s, ss) => s + ss.goals, 0);
              return (
                <Pressable
                  key={i}
                  className={`flex-row items-center rounded-lg px-2 py-2.5 active:bg-neutral-50 ${i < visibleClubs.length - 1 ? 'border-b border-neutral-50' : ''}`}
                  onPress={() => {
                    if (t.team_id != null) router.push(`/teams/${t.team_id}`);
                  }}
                >
                  <TeamLogo uri={t.logo} size={28} teamName={t.team_name ?? ''} />
                  <View className="ml-2.5 min-w-0 flex-1">
                    <Text className="text-[13px] text-neutral-900" numberOfLines={1}>
                      {t.team_name}
                    </Text>
                    {dateRange && <Text className="text-[11px] text-neutral-400">{dateRange}</Text>}
                  </View>
                  <Text
                    className="w-9 text-right text-[13px] font-medium text-neutral-700"
                    style={NUM}
                  >
                    {totalApps}
                  </Text>
                  <Text
                    className="w-9 text-right text-[13px] font-medium text-neutral-700"
                    style={NUM}
                  >
                    {totalGoals}
                  </Text>
                </Pressable>
              );
            })}
            {clubList.length > 5 && (
              <Pressable
                className="mt-1 items-center py-1"
                onPress={() => setClubExpanded(!clubExpanded)}
              >
                <Text className="text-xs font-medium text-neutral-400">
                  {clubExpanded ? '접기' : `더보기 (${clubList.length - 5})`}
                </Text>
              </Pressable>
            )}
          </>
        )}
        {tab === 'season' && (
          <>
            <View className="mb-2 flex-row items-center justify-end px-2">
              <Text className="w-8 text-right text-[10px] text-neutral-400">경기</Text>
              <Text className="w-8 text-right text-[10px] text-neutral-400">골</Text>
              <Text className="w-8 text-right text-[10px] text-neutral-400">도움</Text>
            </View>
            {visibleSeasons.map((s, i) => (
              <View
                key={`${s.season_id}-${s.team_id}-${i}`}
                className={`flex-row items-center rounded-lg px-2 py-2.5 ${i < visibleSeasons.length - 1 ? 'border-b border-neutral-50' : ''}`}
              >
                <TeamLogo uri={s.team_logo} size={20} teamName={s.team_name ?? ''} />
                <View className="ml-2 min-w-0 flex-1">
                  <Text className="text-[13px] text-neutral-900" numberOfLines={1}>
                    {shortenSeason(s.season_name)}
                  </Text>
                  <Text className="text-[11px] text-neutral-400" numberOfLines={1}>
                    {s.team_name}
                  </Text>
                </View>
                <Text
                  className="w-8 text-right text-[13px] font-medium text-neutral-700"
                  style={NUM}
                >
                  {s.appearances}
                </Text>
                <Text className="w-8 text-right text-[13px] font-medium text-primary" style={NUM}>
                  {s.goals}
                </Text>
                <Text
                  className="w-8 text-right text-[13px] font-medium text-neutral-700"
                  style={NUM}
                >
                  {s.assists}
                </Text>
              </View>
            ))}
            {seasonList.length > 5 && (
              <Pressable
                className="mt-1 items-center py-1"
                onPress={() => setSeasonExpanded(!seasonExpanded)}
              >
                <Text className="text-xs font-medium text-neutral-400">
                  {seasonExpanded ? '접기' : `더보기 (${seasonList.length - 5})`}
                </Text>
              </Pressable>
            )}
          </>
        )}
      </View>
    </Card>
  );
}

/* ── 공격포인트 카드 (웹 AttackPointsCard: 골/도움 탭) ── */

function AttackPointsCard({
  goalMatches,
  assistMatches,
  totalGoals,
  router,
}: {
  goalMatches: Array<{
    match_id: number;
    match_date: string | null;
    season_name: string | null;
    opponent_name: string | null;
    player_goals: number;
  }>;
  assistMatches: Array<{
    match_id: number;
    date: string;
    season: string | null;
    opponent_name: string;
    player_assists: number;
  }>;
  totalGoals: number;
  router: ReturnType<typeof useRouter>;
}) {
  const safeGoals = Array.isArray(goalMatches) ? goalMatches : [];
  const safeAssists = Array.isArray(assistMatches) ? assistMatches : [];
  const hasGoals = safeGoals.length > 0;
  const hasAssists = safeAssists.length > 0;

  const activeTab = hasGoals ? 'goals' : 'assists';
  const [tab, setTab] = useState<'goals' | 'assists'>(activeTab);
  // 데이터 로드 후 탭 보정
  if (tab === 'assists' && hasGoals && !hasAssists) setTab('goals');
  if (tab === 'goals' && !hasGoals && hasAssists) setTab('assists');
  const [goalExp, setGoalExp] = useState(false);
  const [assistExp, setAssistExp] = useState(false);

  if (!hasGoals && !hasAssists) return null;

  const visGoals = goalExp ? safeGoals : safeGoals.slice(0, 5);
  const visAssists = assistExp ? safeAssists : safeAssists.slice(0, 5);

  return (
    <Card className="overflow-hidden p-0">
      <View className="px-5 pt-4 pb-2">
        <Text className="text-lg font-medium text-neutral-900">공격포인트</Text>
      </View>
      <View className="flex-row border-b border-neutral-100 px-5">
        {hasGoals && (
          <Pressable className="mr-5 pb-3" onPress={() => setTab('goals')}>
            <Text
              className={`text-sm font-medium ${tab === 'goals' ? 'text-neutral-900' : 'text-neutral-400'}`}
            >
              골 ({totalGoals})
            </Text>
            {tab === 'goals' && <View className="mt-1 h-[2px] w-8 rounded-full bg-primary" />}
          </Pressable>
        )}
        {hasAssists && (
          <Pressable className="pb-3" onPress={() => setTab('assists')}>
            <Text
              className={`text-sm font-medium ${tab === 'assists' ? 'text-neutral-900' : 'text-neutral-400'}`}
            >
              도움 ({safeAssists.length})
            </Text>
            {tab === 'assists' && <View className="mt-1 h-[2px] w-8 rounded-full bg-blue-500" />}
          </Pressable>
        )}
      </View>
      <View className="px-4 py-3">
        {tab === 'goals' && (
          <>
            {visGoals.map((gm, i) => (
              <Pressable
                key={`g-${gm.match_id}-${i}`}
                className={`flex-row items-center py-2.5 active:bg-neutral-50 ${i < visGoals.length - 1 ? 'border-b border-neutral-50' : ''}`}
                onPress={() => router.push(`/matches/${gm.match_id}`)}
              >
                <View className="min-w-0 flex-1">
                  <Text className="text-[10px] text-neutral-400">
                    {gm.match_date ? format(new Date(gm.match_date), 'M.d') : '-'} ·{' '}
                    {shortenSeason(gm.season_name)}
                  </Text>
                  <Text className="text-xs text-neutral-700" numberOfLines={1}>
                    vs {gm.opponent_name}
                  </Text>
                </View>
                <View className="rounded-full bg-primary/10 px-2.5 py-0.5">
                  <Text className="text-[11px] font-bold text-primary">{gm.player_goals}골</Text>
                </View>
              </Pressable>
            ))}
            {safeGoals.length > 5 && (
              <Pressable className="mt-1 items-center py-1" onPress={() => setGoalExp(!goalExp)}>
                <Text className="text-xs font-medium text-neutral-400">
                  {goalExp ? '접기' : `더보기 (${safeGoals.length - 5})`}
                </Text>
              </Pressable>
            )}
          </>
        )}
        {tab === 'assists' && (
          <>
            {visAssists.map((am, i) => (
              <Pressable
                key={`a-${am.match_id}-${i}`}
                className={`flex-row items-center py-2.5 active:bg-neutral-50 ${i < visAssists.length - 1 ? 'border-b border-neutral-50' : ''}`}
                onPress={() => router.push(`/matches/${am.match_id}`)}
              >
                <View className="min-w-0 flex-1">
                  <Text className="text-[10px] text-neutral-400">
                    {am.date ? format(new Date(am.date), 'M.d') : '-'} · {shortenSeason(am.season)}
                  </Text>
                  <Text className="text-xs text-neutral-700" numberOfLines={1}>
                    vs {am.opponent_name}
                  </Text>
                </View>
                <View className="rounded-full bg-blue-50 px-2.5 py-0.5">
                  <Text className="text-[11px] font-bold text-blue-500">
                    {am.player_assists}도움
                  </Text>
                </View>
              </Pressable>
            ))}
            {safeAssists.length > 5 && (
              <Pressable
                className="mt-1 items-center py-1"
                onPress={() => setAssistExp(!assistExp)}
              >
                <Text className="text-xs font-medium text-neutral-400">
                  {assistExp ? '접기' : `더보기 (${safeAssists.length - 5})`}
                </Text>
              </Pressable>
            )}
          </>
        )}
      </View>
    </Card>
  );
}

/* ── 트로피 카드 (웹 PlayerTrophiesCard: 팀/개인 탭) ── */

function TrophiesCard({
  trophiesData,
  awardsData,
}: {
  trophiesData:
    | {
        trophies: Array<{
          team_id: number;
          team_name: string;
          logo: string | null;
          trophies: Array<{ season_id: number; season_name: string }>;
        }>;
      }
    | undefined;
  awardsData:
    | {
        awards: Array<{
          season_id: number;
          award_type: string;
          award_label: string;
          season_name: string;
          stat_value: number;
          is_shared: boolean;
        }>;
      }
    | undefined;
}) {
  const hasTrophies = (trophiesData?.trophies?.length ?? 0) > 0;
  const hasAwards = (awardsData?.awards?.length ?? 0) > 0;
  const [tab, setTab] = useState<'team' | 'individual'>('team');
  // 데이터 로드 후 탭 보정
  if (tab === 'team' && !hasTrophies && hasAwards) setTab('individual');
  if (tab === 'individual' && hasTrophies && !hasAwards) setTab('team');

  if (!hasTrophies && !hasAwards) return null;

  return (
    <Card className="overflow-hidden p-0">
      <View className="px-5 pt-4 pb-2">
        <Text className="text-lg font-medium text-neutral-900">트로피</Text>
      </View>
      {hasTrophies && hasAwards && (
        <View className="flex-row border-b border-neutral-100 px-5">
          <Pressable className="mr-5 pb-3" onPress={() => setTab('team')}>
            <Text
              className={`text-sm font-medium ${tab === 'team' ? 'text-neutral-900' : 'text-neutral-400'}`}
            >
              팀
            </Text>
            {tab === 'team' && <View className="mt-1 h-[2px] w-8 rounded-full bg-amber-500" />}
          </Pressable>
          <Pressable className="pb-3" onPress={() => setTab('individual')}>
            <Text
              className={`text-sm font-medium ${tab === 'individual' ? 'text-neutral-900' : 'text-neutral-400'}`}
            >
              개인
            </Text>
            {tab === 'individual' && (
              <View className="mt-1 h-[2px] w-8 rounded-full bg-amber-500" />
            )}
          </Pressable>
        </View>
      )}
      <View className="px-4 py-3">
        {tab === 'team' &&
          trophiesData?.trophies.map((team) => (
            <View key={team.team_id} className="mb-3">
              <View className="flex-row items-center px-2" style={{ gap: 6 }}>
                <TeamLogo uri={team.logo} size={20} teamName={team.team_name} />
                <Text className="text-[13px] font-semibold text-neutral-700">{team.team_name}</Text>
              </View>
              <View className="mt-1.5 flex-row flex-wrap px-2" style={{ gap: 4 }}>
                {team.trophies.map((t) => (
                  <View
                    key={t.season_id}
                    className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1"
                  >
                    <Text className="text-[11px] font-medium text-amber-800">
                      🏆 {sanitizeLabel(t.season_name)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        {tab === 'individual' &&
          awardsData?.awards.map((award, i) => (
            <View
              key={`${award.season_id}-${award.award_type}-${i}`}
              className={`flex-row items-center px-2 py-2.5 ${i < (awardsData?.awards.length ?? 0) - 1 ? 'border-b border-neutral-50' : ''}`}
            >
              <Trophy size={16} color="#f59e0b" />
              <View className="ml-2.5 flex-1">
                <Text className="text-[13px] font-semibold text-neutral-700">
                  {award.award_label}
                </Text>
                <Text className="text-[11px] text-neutral-400">
                  {sanitizeLabel(award.season_name)} · {award.stat_value}
                  {award.is_shared ? ' (공동)' : ''}
                </Text>
              </View>
            </View>
          ))}
      </View>
    </Card>
  );
}

/* ── 현재 시즌 카드 ── */

function CurrentSeasonCard({ data }: { data: PlayerCurrentSeasonStats }) {
  return (
    <Card className="p-5">
      <SectionHeader
        title={sanitizeLabel(data.season_name) || '현재 시즌'}
        trailing={
          data.team?.team_name ? (
            <Text className="text-[11px] text-neutral-400">{data.team.team_name}</Text>
          ) : undefined
        }
      />
      <View className="flex-row flex-wrap">
        <View className="w-1/3 items-center py-2">
          <Text className="text-lg font-bold text-neutral-800" style={NUM}>
            {data.matches}
          </Text>
          <Text className="text-[10px] text-neutral-400">경기</Text>
        </View>
        <View className="w-1/3 items-center py-2">
          <Text className="text-lg font-bold text-primary" style={NUM}>
            {data.goals}
          </Text>
          <Text className="text-[10px] text-neutral-400">득점</Text>
        </View>
        <View className="w-1/3 items-center py-2">
          <Text className="text-lg font-bold text-neutral-800" style={NUM}>
            {data.assists}
          </Text>
          <Text className="text-[10px] text-neutral-400">도움</Text>
        </View>
        {data.avg_rating != null && (
          <View className="w-1/3 items-center py-2">
            <Text className="text-lg font-bold text-emerald-500" style={NUM}>
              {data.avg_rating.toFixed(1)}
            </Text>
            <Text className="text-[10px] text-neutral-400">평점</Text>
          </View>
        )}
        {data.avg_xt_rating != null && (
          <View className="w-1/3 items-center py-2">
            <Text className="text-lg font-bold text-blue-500" style={NUM}>
              {data.avg_xt_rating.toFixed(1)}
            </Text>
            <Text className="text-[10px] text-neutral-400">xT평점</Text>
          </View>
        )}
        <View className="w-1/3 items-center py-2">
          <Text className="text-lg font-bold text-amber-500" style={NUM}>
            {data.yellow_cards}
          </Text>
          <Text className="text-[10px] text-neutral-400">경고</Text>
        </View>
        {data.is_goalkeeper && (
          <>
            <View className="w-1/3 items-center py-2">
              <Text className="text-lg font-bold text-red-400" style={NUM}>
                {data.goals_conceded}
              </Text>
              <Text className="text-[10px] text-neutral-400">실점</Text>
            </View>
            <View className="w-1/3 items-center py-2">
              <Text className="text-lg font-bold text-emerald-500" style={NUM}>
                {data.clean_sheets}
              </Text>
              <Text className="text-[10px] text-neutral-400">클린시트</Text>
            </View>
          </>
        )}
      </View>
    </Card>
  );
}

/* ── 경기 로그 행 ── */

function MatchLogRow({
  m,
  isLast,
  onPress,
}: {
  m: PlayerMatchLogEntry;
  isLast: boolean;
  onPress: () => void;
}) {
  const resultColor =
    m.result === 'W' ? 'text-emerald-600' : m.result === 'L' ? 'text-red-500' : 'text-neutral-500';

  return (
    <Pressable
      className={`flex-row items-center py-2.5 active:bg-neutral-50 ${!isLast ? 'border-b border-neutral-50' : ''}`}
      onPress={onPress}
    >
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center" style={{ gap: 4 }}>
          <Text className="text-[11px] text-neutral-400" style={NUM}>
            {m.date ? format(new Date(m.date), 'M.d') : '-'}
          </Text>
          <Text className="text-[11px] text-neutral-600" numberOfLines={1}>
            vs {m.opponent_name}
          </Text>
          <Text className={`text-[10px] font-bold ${resultColor}`}>
            {m.home_score}-{m.away_score}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center" style={{ gap: 4 }}>
        <Text className="w-6 text-center text-[12px] font-bold text-primary" style={NUM}>
          {m.goals || '-'}
        </Text>
        <Text className="w-6 text-center text-[12px] font-bold text-neutral-700" style={NUM}>
          {m.assists || '-'}
        </Text>
        <View className="w-8 items-center">
          {m.rating != null ? (
            <View
              className="rounded px-1 py-px"
              style={{
                backgroundColor: m.rating >= 7 ? '#DEF7EC' : m.rating >= 5 ? '#FEF3C7' : '#FEE2E2',
              }}
            >
              <Text className="text-[10px] font-bold text-neutral-700" style={NUM}>
                {m.rating.toFixed(1)}
              </Text>
            </View>
          ) : (
            <Text className="text-[10px] text-neutral-300">-</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

/* ── 선수 특성 레이더 ── */

function TraitsRadarCard({
  traits,
}: {
  traits: {
    touches?: number;
    chance_creation?: number;
    shots?: number;
    goals?: number;
    defensive?: number;
    pass_accuracy?: number;
    gk_distribution?: number;
    clean_sheet?: number;
    goals_conceded?: number;
    saves?: number;
    clearances?: number;
    matches_analyzed: number;
    is_goalkeeper: boolean;
  };
}) {
  const isGKTraits = traits.is_goalkeeper;
  const labels = isGKTraits
    ? ['패스', '배급', '클린시트', '실점', '선방', '클리어']
    : ['터치', '기회창출', '슛', '득점', '수비', '패스'];
  const values = isGKTraits
    ? [
        traits.pass_accuracy ?? 0,
        traits.gk_distribution ?? 0,
        traits.clean_sheet ?? 0,
        traits.goals_conceded ?? 0,
        traits.saves ?? 0,
        traits.clearances ?? 0,
      ]
    : [
        traits.touches ?? 0,
        traits.chance_creation ?? 0,
        traits.shots ?? 0,
        traits.goals ?? 0,
        traits.defensive ?? 0,
        traits.pass_accuracy ?? 0,
      ];

  const cx = 120;
  const cy = 110;
  const r = 80;
  const n = labels.length;
  const angles = labels.map((_, i) => (Math.PI * 2 * i) / n - Math.PI / 2);

  const dataPoints = values.map((v, i) => {
    const dist = (v / 100) * r;
    return { x: cx + dist * Math.cos(angles[i]), y: cy + dist * Math.sin(angles[i]) };
  });
  const polygonPoints = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <Card className="p-5">
      <SectionHeader
        title="선수 특성"
        trailing={
          <Text className="text-[10px] text-neutral-400">{traits.matches_analyzed}경기 분석</Text>
        }
      />
      <View className="items-center">
        <Svg width={240} height={220} viewBox="0 0 240 220">
          {[0.25, 0.5, 0.75, 1].map((scale) => (
            <Polygon
              key={String(scale)}
              points={angles
                .map((a) => `${cx + r * scale * Math.cos(a)},${cy + r * scale * Math.sin(a)}`)
                .join(' ')}
              fill="none"
              stroke="#e5e5e5"
              strokeWidth={0.5}
            />
          ))}
          {angles.map((a, i) => (
            <Line
              key={String(i)}
              x1={cx}
              y1={cy}
              x2={cx + r * Math.cos(a)}
              y2={cy + r * Math.sin(a)}
              stroke="#e5e5e5"
              strokeWidth={0.5}
            />
          ))}
          <Polygon
            points={polygonPoints}
            fill="rgba(255,72,0,0.15)"
            stroke="#ff4800"
            strokeWidth={1.5}
          />
          {dataPoints.map((p, i) => (
            <Circle key={String(i)} cx={p.x} cy={p.y} r={3} fill="#ff4800" />
          ))}
          {labels.map((label, i) => {
            const lx = cx + (r + 22) * Math.cos(angles[i]);
            const ly = cy + (r + 22) * Math.sin(angles[i]);
            return (
              <SvgText
                key={label}
                x={lx}
                y={ly + 3}
                textAnchor="middle"
                fontSize={9}
                fill="#737373"
              >
                {label}
              </SvgText>
            );
          })}
          {values.map((v, i) => (
            <SvgText
              key={`val-${String(i)}`}
              x={dataPoints[i].x}
              y={dataPoints[i].y - 8}
              textAnchor="middle"
              fontSize={8}
              fontWeight="bold"
              fill="#ff4800"
            >
              {v}
            </SvgText>
          ))}
        </Svg>
      </View>
    </Card>
  );
}

/* ── 패스 맵 ── */

function PassMapCard({
  passMapData,
  onPrev,
  onNext,
}: {
  passMapData: {
    matches: Array<{
      match_id: number;
      match_date: string;
      home_team_name: string;
      home_team_logo: string | null;
      away_team_name: string;
      away_team_logo: string | null;
      home_score: number | null;
      away_score: number | null;
      total_passes: number;
      successful_passes: number;
    }>;
    match_id: number;
    flip_first_half: boolean;
    passes: Array<{
      action_id: number;
      period_id: 1 | 2;
      start_x: number;
      start_y: number;
      end_x: number;
      end_y: number;
      result: string;
    }>;
  };
  onPrev: () => void;
  onNext: () => void;
}) {
  const currentIdx = passMapData.matches.findIndex((m) => m.match_id === passMapData.match_id);
  const currentMatch = passMapData.matches[currentIdx];
  const totalPasses = passMapData.passes.length;
  const successPasses = passMapData.passes.filter((p) => p.result === 'SUCCESS').length;
  const successRate = totalPasses > 0 ? Math.round((successPasses / totalPasses) * 100) : 0;

  // 평균 거리 계산
  let totalDist = 0;
  for (const p of passMapData.passes) {
    totalDist += Math.sqrt((p.end_x - p.start_x) ** 2 + (p.end_y - p.start_y) ** 2);
  }
  const avgDistance = totalPasses > 0 ? (totalDist / totalPasses).toFixed(1) : '0';

  return (
    <Card className="overflow-hidden p-0">
      <View className="border-b border-neutral-100 px-5 py-4">
        <Text className="text-lg font-medium text-neutral-900">패스맵</Text>
      </View>

      {/* 피치 + 통계 */}
      <View className="p-4">
        {/* 회색+흰색 피치 (웹 동일) */}
        <Svg width="100%" height={180} viewBox="0 0 400 200">
          <Rect x={0} y={0} width={400} height={200} rx={6} fill="#EFEFEF" />
          <Rect
            x={8}
            y={8}
            width={384}
            height={184}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.5}
          />
          <Line x1={200} y1={8} x2={200} y2={192} stroke="#FFFFFF" strokeWidth={1.5} />
          <Circle cx={200} cy={100} r={30} fill="none" stroke="#FFFFFF" strokeWidth={1.5} />
          {/* 좌측 페널티 */}
          <Rect
            x={8}
            y={55}
            width={50}
            height={90}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.5}
          />
          {/* 우측 페널티 */}
          <Rect
            x={342}
            y={55}
            width={50}
            height={90}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.5}
          />

          {/* 패스 라인 (실패 먼저, 성공 나중) */}
          {passMapData.passes
            .filter((p) => p.result !== 'SUCCESS')
            .map((p) => {
              let sx = (p.start_x / 40) * 400;
              let sy = (p.start_y / 20) * 200;
              let ex = (p.end_x / 40) * 400;
              let ey = (p.end_y / 20) * 200;
              if (passMapData.flip_first_half && p.period_id === 1) {
                sx = 400 - sx;
                sy = 200 - sy;
                ex = 400 - ex;
                ey = 200 - ey;
              }
              return (
                <React.Fragment key={`f-${p.action_id}`}>
                  <Line
                    x1={sx}
                    y1={sy}
                    x2={ex}
                    y2={ey}
                    stroke="rgba(220,38,38,0.6)"
                    strokeWidth={1}
                  />
                  <Circle cx={sx} cy={sy} r={2.5} fill="rgba(220,38,38,0.8)" />
                </React.Fragment>
              );
            })}
          {passMapData.passes
            .filter((p) => p.result === 'SUCCESS')
            .map((p) => {
              let sx = (p.start_x / 40) * 400;
              let sy = (p.start_y / 20) * 200;
              let ex = (p.end_x / 40) * 400;
              let ey = (p.end_y / 20) * 200;
              if (passMapData.flip_first_half && p.period_id === 1) {
                sx = 400 - sx;
                sy = 200 - sy;
                ex = 400 - ex;
                ey = 200 - ey;
              }
              return (
                <React.Fragment key={`s-${p.action_id}`}>
                  <Line
                    x1={sx}
                    y1={sy}
                    x2={ex}
                    y2={ey}
                    stroke="rgba(22,163,74,0.6)"
                    strokeWidth={1}
                  />
                  <Circle cx={sx} cy={sy} r={2.5} fill="rgba(22,163,74,0.8)" />
                </React.Fragment>
              );
            })}
        </Svg>

        {/* 범례 */}
        <View className="mt-2 flex-row justify-center" style={{ gap: 12 }}>
          <View className="flex-row items-center" style={{ gap: 4 }}>
            <View
              style={{
                width: 8,
                height: 3,
                borderRadius: 1,
                backgroundColor: 'rgba(22,163,74,0.8)',
              }}
            />
            <Text className="text-[10px] text-neutral-400">성공</Text>
          </View>
          <View className="flex-row items-center" style={{ gap: 4 }}>
            <View
              style={{
                width: 8,
                height: 3,
                borderRadius: 1,
                backgroundColor: 'rgba(220,38,38,0.8)',
              }}
            />
            <Text className="text-[10px] text-neutral-400">실패</Text>
          </View>
        </View>

        {/* 통계 (웹 SummaryCell 스타일) */}
        <View className="mt-4 flex-row justify-around">
          <View className="items-center">
            <Text className="text-xl font-semibold text-neutral-900" style={NUM}>
              {totalPasses}
            </Text>
            <Text className="mt-0.5 text-[11px] text-neutral-500">패스</Text>
          </View>
          <View className="items-center">
            <Text className="text-xl font-semibold text-neutral-900" style={NUM}>
              {successRate}%
            </Text>
            <Text className="mt-0.5 text-[11px] text-neutral-500">성공률</Text>
          </View>
          <View className="items-center">
            <Text className="text-xl font-semibold text-neutral-900" style={NUM}>
              {avgDistance}m
            </Text>
            <Text className="mt-0.5 text-[11px] text-neutral-500">평균 거리</Text>
          </View>
        </View>
      </View>

      {/* 하단 네비게이션: 팀 로고 + 스코어 */}
      <View className="flex-row items-center justify-between border-t border-neutral-100 px-4 py-3">
        <Pressable disabled={currentIdx <= 0} onPress={onPrev} hitSlop={8}>
          <View
            className={`h-7 w-7 items-center justify-center rounded-full ${currentIdx <= 0 ? 'bg-neutral-50' : 'bg-neutral-100'}`}
          >
            <Text
              className={`text-xs font-bold ${currentIdx <= 0 ? 'text-neutral-300' : 'text-neutral-600'}`}
            >
              ◀
            </Text>
          </View>
        </Pressable>
        {currentMatch && (
          <View className="flex-row items-center" style={{ gap: 8 }}>
            {currentMatch.home_team_logo ? (
              <Image
                source={{ uri: currentMatch.home_team_logo }}
                style={{ width: 20, height: 20, borderRadius: 10 }}
                contentFit="cover"
              />
            ) : (
              <Text className="text-[10px] text-neutral-500">{currentMatch.home_team_name}</Text>
            )}
            <Text className="text-sm font-bold text-neutral-800" style={NUM}>
              {currentMatch.home_score ?? '-'} - {currentMatch.away_score ?? '-'}
            </Text>
            {currentMatch.away_team_logo ? (
              <Image
                source={{ uri: currentMatch.away_team_logo }}
                style={{ width: 20, height: 20, borderRadius: 10 }}
                contentFit="cover"
              />
            ) : (
              <Text className="text-[10px] text-neutral-500">{currentMatch.away_team_name}</Text>
            )}
          </View>
        )}
        <Pressable
          disabled={currentIdx >= passMapData.matches.length - 1}
          onPress={onNext}
          hitSlop={8}
        >
          <View
            className={`h-7 w-7 items-center justify-center rounded-full ${currentIdx >= passMapData.matches.length - 1 ? 'bg-neutral-50' : 'bg-neutral-100'}`}
          >
            <Text
              className={`text-xs font-bold ${currentIdx >= passMapData.matches.length - 1 ? 'text-neutral-300' : 'text-neutral-600'}`}
            >
              ▶
            </Text>
          </View>
        </Pressable>
      </View>
    </Card>
  );
}

/* ── 시즌 성적 지표 (웹 SeasonDetailedStatsCard 동일) ── */

const FIELD_CATEGORIES = [
  {
    category: '슈팅',
    catKey: 'shooting',
    items: [
      { key: 'goals', label: '득점' },
      { key: 'shots', label: '슈팅' },
      { key: 'shots_on_target', label: '유효슈팅' },
    ],
  },
  {
    category: '패스',
    catKey: 'passing',
    items: [
      { key: 'assists', label: '어시스트' },
      { key: 'pass_success', label: '패스성공' },
      { key: 'pass_accuracy', label: '패스정확도' },
      { key: 'key_passes', label: '키패스' },
    ],
  },
  {
    category: '수비',
    catKey: 'defense',
    items: [
      { key: 'tackles', label: '태클' },
      { key: 'interceptions', label: '인터셉션' },
      { key: 'clearances', label: '클리어런스' },
    ],
  },
  {
    category: '반칙',
    catKey: 'discipline',
    items: [
      { key: 'fouls', label: '파울' },
      { key: 'yellow_cards', label: '경고' },
      { key: 'red_cards', label: '퇴장' },
    ],
  },
];
const GK_CATEGORIES = [
  {
    category: '골키핑',
    catKey: 'shooting',
    items: [
      { key: 'saves', label: '선방' },
      { key: 'goals_conceded', label: '실점' },
      { key: 'clean_sheets', label: '클린시트' },
      { key: 'penalty_saves', label: 'PK선방' },
    ],
  },
  {
    category: '배급',
    catKey: 'distribution',
    items: [
      { key: 'throws_attempted', label: '던지기시도' },
      { key: 'throws_success', label: '던지기성공' },
      { key: 'pass_success', label: '패스성공' },
      { key: 'pass_accuracy', label: '패스정확도' },
    ],
  },
  {
    category: '수비',
    catKey: 'defense',
    items: [
      { key: 'clearances', label: '클리어런스' },
      { key: 'interceptions', label: '인터셉션' },
    ],
  },
  {
    category: '반칙',
    catKey: 'discipline',
    items: [
      { key: 'fouls', label: '파울' },
      { key: 'yellow_cards', label: '경고' },
      { key: 'red_cards', label: '퇴장' },
    ],
  },
];

function getBarColor(pct: number): string {
  if (pct >= 70) return '#22C55E';
  if (pct >= 30) return '#F59E0B';
  return '#EF4444';
}

function SeasonDetailedStatsSection({ playerId }: { playerId: number }) {
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | undefined>(undefined);
  const [mode, setMode] = useState<'total' | 'per_match'>('total');
  const [showSeasonPicker, setShowSeasonPicker] = useState(false);

  const { data } = useQuery({
    queryKey: ['playerDetailedStats', playerId, selectedSeasonId],
    queryFn: () => getPlayerDetailedStats(playerId, selectedSeasonId),
  });

  if (!data?.data) return null;

  const d = data.data;
  const seasons = data.seasons ?? [];
  const currentSeason = seasons.find((s) => s.season_id === data.season_id) ?? seasons[0];
  const statsConfig = data.is_goalkeeper ? GK_CATEGORIES : FIELD_CATEGORIES;

  const getStat = (catKey: string, key: string): StatItem | null => {
    const catData = (d as Record<string, unknown>)[catKey];
    if (!catData || typeof catData !== 'object') return null;
    return (catData as Record<string, StatItem>)[key] ?? null;
  };

  return (
    <Card className="overflow-hidden p-0">
      <View className="px-5 pt-4 pb-2">
        <Text className="text-lg font-medium text-neutral-900">시즌 성적</Text>
      </View>

      {/* 시즌 선택 + 합계/경기당 탭 */}
      <View className="flex-row items-center justify-between border-b border-neutral-100 px-5 pb-3">
        {/* 시즌 선택 */}
        <Pressable
          className="flex-row items-center rounded-lg bg-neutral-100 px-3 py-1.5"
          onPress={() => setShowSeasonPicker(true)}
        >
          <Text className="text-xs font-medium text-neutral-700">
            {currentSeason ? sanitizeLabel(currentSeason.season_name) : '시즌'}
          </Text>
          <Text className="ml-1 text-[10px] text-neutral-400">▼</Text>
        </Pressable>

        {/* 합계 / 경기당 토글 */}
        <View className="flex-row rounded-lg bg-neutral-100 p-0.5">
          <Pressable
            className={`rounded-md px-3 py-1 ${mode === 'total' ? 'bg-white' : ''}`}
            onPress={() => setMode('total')}
          >
            <Text
              className={`text-[11px] font-bold ${mode === 'total' ? 'text-neutral-800' : 'text-neutral-400'}`}
            >
              합계
            </Text>
          </Pressable>
          <Pressable
            className={`rounded-md px-3 py-1 ${mode === 'per_match' ? 'bg-white' : ''}`}
            onPress={() => setMode('per_match')}
          >
            <Text
              className={`text-[11px] font-bold ${mode === 'per_match' ? 'text-neutral-800' : 'text-neutral-400'}`}
            >
              경기당
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 통계 내용 */}
      <View className="px-4 py-3">
        <Text className="mb-3 text-[11px] text-neutral-400">
          {d.matches}경기 · {data.total_players}명 중 백분위
        </Text>
        {statsConfig.map((cat) => {
          const hasData = cat.items.some((item) => getStat(cat.catKey, item.key) != null);
          if (!hasData) return null;
          return (
            <View key={cat.category} className="mb-4">
              <Text className="mb-2 text-xs font-semibold text-neutral-500">{cat.category}</Text>
              {cat.items.map((item) => {
                const stat = getStat(cat.catKey, item.key);
                if (!stat) return null;
                const pct = mode === 'per_match' ? stat.percentile_per_match : stat.percentile;
                const val = stat.value;
                const displayVal =
                  mode === 'per_match' && d.matches > 0
                    ? (val / d.matches).toFixed(1)
                    : typeof val === 'number' && val % 1 !== 0
                      ? val.toFixed(1)
                      : String(val);
                return (
                  <View key={item.key} className="mb-2.5">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-[12px] text-neutral-700">{item.label}</Text>
                      <View className="flex-row items-center" style={{ gap: 6 }}>
                        <Text className="text-[13px] font-semibold text-neutral-900" style={NUM}>
                          {displayVal}
                        </Text>
                        <View
                          className="rounded px-1.5 py-px"
                          style={{ backgroundColor: getBarColor(pct) + '20' }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: '700',
                              color: getBarColor(pct),
                              ...NUM,
                            }}
                          >
                            {pct}%
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View className="mt-1 h-1.5 rounded-full bg-neutral-100">
                      <View
                        className="h-1.5 rounded-full"
                        style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: getBarColor(pct) }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>

      {/* 시즌 선택 모달 */}
      {showSeasonPicker && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setShowSeasonPicker(false)}
        >
          <Pressable className="flex-1 bg-black/40" onPress={() => setShowSeasonPicker(false)} />
          <View className="rounded-t-3xl bg-white px-5 pb-10 pt-4" style={{ maxHeight: '50%' }}>
            <Text className="mb-4 text-base font-bold text-neutral-800">시즌 선택</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {seasons.map((s) => (
                <Pressable
                  key={s.season_id}
                  className={`rounded-xl px-4 py-3 ${data.season_id === s.season_id ? 'bg-primary/10' : ''}`}
                  onPress={() => {
                    setSelectedSeasonId(s.season_id);
                    setShowSeasonPicker(false);
                  }}
                >
                  <Text
                    className={`text-sm ${data.season_id === s.season_id ? 'font-bold text-primary' : 'text-neutral-700'}`}
                  >
                    {sanitizeLabel(s.season_name)} ({s.match_count}경기)
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Modal>
      )}
    </Card>
  );
}

/* ══════════ 메인 화면 ══════════ */

export default function PlayerDetailScreen() {
  const { playerId } = useLocalSearchParams<{ playerId: string }>();
  const id = Number(playerId);
  const router = useRouter();

  /* ── 데이터 쿼리 ── */
  const {
    data: player,
    isLoading,
    isError,
    refetch,
  } = useQuery({ queryKey: ['playerById', id], queryFn: () => getPlayerByIdPrisma(id) });
  const { data: summary } = useQuery({
    queryKey: ['playerSummary', id],
    queryFn: () => getPlayerSummaryPrisma(id),
  });
  const { data: traitsData } = useQuery({
    queryKey: ['playerTraits', id],
    queryFn: () => getPlayerTraits(id),
  });
  const { data: trophiesData } = useQuery({
    queryKey: ['playerTrophies', id],
    queryFn: () => getPlayerTrophies(id),
  });
  const { data: awardsData } = useQuery({
    queryKey: ['playerIndividualAwards', id],
    queryFn: () => getPlayerIndividualAwards(id),
  });
  const { data: currentSeasonData } = useQuery({
    queryKey: ['playerCurrentSeason', id],
    queryFn: () => getPlayerCurrentSeason(id),
  });

  const [matchLogCursor, setMatchLogCursor] = useState<string | null>(null);
  const [matchLogHistory, setMatchLogHistory] = useState<string[]>([]);
  const { data: matchLogData } = useQuery({
    queryKey: ['playerMatchLog', id, matchLogCursor],
    queryFn: () => getPlayerMatchLog(id, matchLogCursor, 10),
  });

  const [passMapMatchId, setPassMapMatchId] = useState<number | undefined>(undefined);
  const { data: passMapData } = useQuery({
    queryKey: ['playerPassMap', id, passMapMatchId],
    queryFn: () => getPlayerPassMap(id, passMapMatchId),
  });

  /* ── 팀 이력 병합 ── */
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

  const isGK = summary?.primary_position === 'GK';

  const { data: gkStatsData } = useQuery({
    queryKey: ['playerGoalkeeperStats', id],
    queryFn: () => getPlayerGoalkeeperStats(id),
    enabled: isGK === true,
  });

  const { data: assistLogData } = useQuery({
    queryKey: ['playerAssistLog', id],
    queryFn: () => getPlayerAssistLog(id),
  });

  const [gkTab, setGkTab] = useState<'conceded' | 'clean' | 'season'>('conceded');

  if (isLoading) return <LoadingSpinner />;
  if (isError || !player) return <ErrorState onRetry={() => refetch()} />;

  const totalGoals = summary?.goal_matches?.reduce((sum, gm) => sum + gm.player_goals, 0) ?? 0;
  const hasTraits = traitsData?.traits && traitsData.traits.matches_analyzed > 0;
  const hasPassMap = passMapData && passMapData.passes.length > 0;
  const goalMatches = summary?.goal_matches ?? [];
  const assistMatches = assistLogData ?? [];
  const playerAbout = (player as { about?: string | null }).about;

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
        <View style={{ gap: 16 }} className="px-4 pb-10 pt-4">
          {/* ── 1. 헤더 카드 (웹 동일: 팀색 배너 + 정보 그리드 통합) ── */}
          <PlayerHeaderCard
            player={player}
            summary={summary}
            teamHistory={mergedTeamHistory}
            rawTeamHistory={summary?.team_history}
          />

          {/* ── 2. 선수 특성 (웹: 헤더 옆) ── */}
          {hasTraits && <TraitsRadarCard traits={traitsData!.traits} />}

          {/* ── 3. 경력 (웹: CareerCard - traits 없을 때 여기) ── */}
          {!hasTraits && (
            <CareerCard
              teamHistory={mergedTeamHistory}
              seasons={summary?.seasons}
              router={router}
            />
          )}

          {/* ── 4. 현재 시즌 ── */}
          {currentSeasonData && <CurrentSeasonCard data={currentSeasonData} />}

          {/* ── 5. 선수 비교 버튼 ── */}
          <Pressable
            className="flex-row items-center justify-center rounded-2xl border border-neutral-100 bg-white px-4 py-3 active:bg-neutral-50"
            onPress={() => router.push(`/stats/player-compare?player1=${id}`)}
          >
            <BarChart3 size={16} color="#6366f1" />
            <Text className="ml-2 text-sm font-semibold text-indigo-500">다른 선수와 비교</Text>
          </Pressable>

          {/* ── 6. 경기 로그 ── */}
          {matchLogData && matchLogData.items && matchLogData.items.length > 0 && (
            <Card className="p-5">
              <SectionHeader
                title="경기 기록"
                trailing={
                  <Text className="text-[10px] text-neutral-400">{matchLogData.total}경기</Text>
                }
              />
              <View className="mb-1 flex-row items-center border-b border-neutral-100 pb-1.5">
                <View className="flex-1" />
                <View className="flex-row" style={{ gap: 4 }}>
                  <Text className="w-6 text-center text-[9px] font-medium text-neutral-400">G</Text>
                  <Text className="w-6 text-center text-[9px] font-medium text-neutral-400">A</Text>
                  <Text className="w-8 text-center text-[9px] font-medium text-neutral-400">
                    평점
                  </Text>
                </View>
              </View>
              {matchLogData.items.map((m, i) => (
                <MatchLogRow
                  key={`${m.match_id}-${i}`}
                  m={m}
                  isLast={i === matchLogData.items.length - 1}
                  onPress={() => router.push(`/matches/${m.match_id}`)}
                />
              ))}
              {(matchLogHistory.length > 0 || matchLogData.hasNext) && (
                <View className="mt-3 flex-row items-center justify-center" style={{ gap: 8 }}>
                  <Pressable
                    className="rounded-lg bg-neutral-100 px-3 py-1.5"
                    disabled={matchLogHistory.length === 0}
                    onPress={() => {
                      const prev = [...matchLogHistory];
                      const prevCursor = prev.pop() ?? null;
                      setMatchLogHistory(prev);
                      setMatchLogCursor(prevCursor === '' ? null : prevCursor);
                    }}
                  >
                    <Text
                      className={`text-xs font-medium ${matchLogHistory.length === 0 ? 'text-neutral-300' : 'text-neutral-600'}`}
                    >
                      이전
                    </Text>
                  </Pressable>
                  <Pressable
                    className="rounded-lg bg-neutral-100 px-3 py-1.5"
                    disabled={!matchLogData.hasNext}
                    onPress={() => {
                      if (matchLogData.nextCursor) {
                        setMatchLogHistory((h) => [...h, matchLogCursor ?? '']);
                        setMatchLogCursor(matchLogData.nextCursor);
                      }
                    }}
                  >
                    <Text
                      className={`text-xs font-medium ${!matchLogData.hasNext ? 'text-neutral-300' : 'text-neutral-600'}`}
                    >
                      다음
                    </Text>
                  </Pressable>
                </View>
              )}
            </Card>
          )}

          {/* ── 7. 경력 (웹: CareerCard - traits 있을 때 여기) ── */}
          {hasTraits && (
            <CareerCard
              teamHistory={mergedTeamHistory}
              seasons={summary?.seasons}
              router={router}
            />
          )}

          {/* ── 8. 골키퍼 통계 (웹: GK 경험 있으면 표시) ── */}
          {isGK && gkStatsData && (
            <Card className="p-5">
              <SectionHeader title="골키퍼 통계" />
              <View className="mb-3 flex-row rounded-lg bg-neutral-100 p-0.5">
                {(
                  [
                    ['conceded', '실점'],
                    ['clean', '클린시트'],
                    ['season', '시즌'],
                  ] as const
                ).map(([key, label]) => (
                  <Pressable
                    key={key}
                    className={`flex-1 items-center rounded-md py-1.5 ${gkTab === key ? 'bg-white' : ''}`}
                    onPress={() => setGkTab(key)}
                  >
                    <Text
                      className={`text-xs font-bold ${gkTab === key ? 'text-neutral-800' : 'text-neutral-400'}`}
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {gkTab === 'conceded' &&
                gkStatsData.recent_matches?.slice(0, 5).map((m, i) => (
                  <Pressable
                    key={`gk-c-${m.match_id}-${i}`}
                    className={`flex-row items-center py-2.5 active:bg-neutral-50 ${i < Math.min(gkStatsData.recent_matches?.length ?? 0, 5) - 1 ? 'border-b border-neutral-50' : ''}`}
                    onPress={() => router.push(`/matches/${m.match_id}`)}
                  >
                    <View className="min-w-0 flex-1">
                      <Text className="text-[11px] text-neutral-400">
                        {m.match_date ? format(new Date(m.match_date), 'M.d') : '-'} ·{' '}
                        {shortenSeason(m.season_name)}
                      </Text>
                      <Text className="text-xs text-neutral-700" numberOfLines={1}>
                        vs {m.opponent_name}
                      </Text>
                    </View>
                    <View
                      className={`rounded-full px-2 py-0.5 ${m.is_clean_sheet ? 'bg-emerald-50' : 'bg-red-50'}`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${m.is_clean_sheet ? 'text-emerald-600' : 'text-red-500'}`}
                      >
                        {m.is_clean_sheet ? '무실점' : `-${m.goals_conceded}`}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              {gkTab === 'clean' &&
                gkStatsData.clean_sheet_matches?.slice(0, 5).map((m, i) => (
                  <Pressable
                    key={`gk-cs-${m.match_id}-${i}`}
                    className={`flex-row items-center py-2.5 active:bg-neutral-50 ${i < Math.min(gkStatsData.clean_sheet_matches?.length ?? 0, 5) - 1 ? 'border-b border-neutral-50' : ''}`}
                    onPress={() => router.push(`/matches/${m.match_id}`)}
                  >
                    <View className="min-w-0 flex-1">
                      <Text className="text-[11px] text-neutral-400">
                        {m.match_date ? format(new Date(m.match_date), 'M.d') : '-'} ·{' '}
                        {shortenSeason(m.season_name)}
                      </Text>
                      <Text className="text-xs text-neutral-700" numberOfLines={1}>
                        vs {m.opponent_name}
                      </Text>
                    </View>
                    <View className="rounded-full bg-emerald-50 px-2 py-0.5">
                      <Text className="text-[10px] font-bold text-emerald-600">무실점</Text>
                    </View>
                  </Pressable>
                ))}
              {gkTab === 'season' && gkStatsData.season_stats?.length > 0 && (
                <View>
                  <View className="mb-1 flex-row border-b border-neutral-100 pb-1.5">
                    <Text className="flex-1 text-[9px] font-medium text-neutral-400">시즌</Text>
                    <Text className="w-8 text-center text-[9px] font-medium text-neutral-400">
                      경기
                    </Text>
                    <Text className="w-8 text-center text-[9px] font-medium text-neutral-400">
                      실점
                    </Text>
                    <Text className="w-8 text-center text-[9px] font-medium text-neutral-400">
                      CS
                    </Text>
                    <Text className="w-10 text-center text-[9px] font-medium text-neutral-400">
                      CS%
                    </Text>
                  </View>
                  {gkStatsData.season_stats.map((s, i) => (
                    <View
                      key={`gk-s-${i}`}
                      className={`flex-row items-center py-2 ${i < gkStatsData.season_stats.length - 1 ? 'border-b border-neutral-50' : ''}`}
                    >
                      <Text className="flex-1 text-[11px] text-neutral-700" numberOfLines={1}>
                        {shortenSeason(s.season_name)}
                      </Text>
                      <Text
                        className="w-8 text-center text-[11px] font-bold text-neutral-700"
                        style={NUM}
                      >
                        {s.matches_played}
                      </Text>
                      <Text
                        className="w-8 text-center text-[11px] font-bold text-red-400"
                        style={NUM}
                      >
                        {s.goals_conceded}
                      </Text>
                      <Text
                        className="w-8 text-center text-[11px] font-bold text-emerald-500"
                        style={NUM}
                      >
                        {s.clean_sheets}
                      </Text>
                      <Text
                        className="w-10 text-center text-[11px] font-bold text-neutral-600"
                        style={NUM}
                      >
                        {s.clean_sheet_percentage}%
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          )}

          {/* ── 9. 공격포인트 (웹: AttackPointsCard - 골/도움 탭) ── */}
          <AttackPointsCard
            goalMatches={goalMatches}
            assistMatches={assistMatches}
            totalGoals={totalGoals}
            router={router}
          />

          {/* ── 10. 트로피 (웹: PlayerTrophiesCard - 팀/개인 탭) ── */}
          <TrophiesCard trophiesData={trophiesData} awardsData={awardsData} />

          {/* ── 11. 패스 맵 (웹: 모바일 하단) ── */}
          {hasPassMap && (
            <PassMapCard
              passMapData={passMapData}
              onPrev={() => {
                const idx = passMapData.matches.findIndex(
                  (m) => m.match_id === passMapData.match_id
                );
                if (idx > 0) setPassMapMatchId(passMapData.matches[idx - 1].match_id);
              }}
              onNext={() => {
                const idx = passMapData.matches.findIndex(
                  (m) => m.match_id === passMapData.match_id
                );
                if (idx < passMapData.matches.length - 1)
                  setPassMapMatchId(passMapData.matches[idx + 1].match_id);
              }}
            />
          )}

          {/* ── 12. 시즌 성적 지표 (웹: SeasonDetailedStatsCard) ── */}
          <SeasonDetailedStatsSection playerId={id} />

          {/* ── 13. About (웹: 모바일 하단) ── */}
          {playerAbout ? (
            <Card className="p-5">
              <SectionHeader title="About" />
              <Text className="text-[13px] leading-5 text-neutral-600">
                {sanitizeLabel(playerAbout)}
              </Text>
            </Card>
          ) : null}
        </View>
      </ScrollView>
    </>
  );
}
