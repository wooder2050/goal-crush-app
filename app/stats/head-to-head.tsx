import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Stack, useRouter } from 'expo-router';
import { ChevronDown, X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { getHeadToHead, getTeamOptions, HeadToHeadStats, TeamOption } from '@/api/stats';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TeamLogo } from '@/components/TeamLogo';

const NUM = { fontVariant: ['tabular-nums' as const] };

/* ── 팀 선택 바텀시트 ── */
function TeamSelectSheet({
  visible,
  onClose,
  title,
  teams,
  selected,
  excludeId,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  teams: TeamOption[];
  selected: number | null;
  excludeId: number | null;
  onSelect: (id: number) => void;
}) {
  const filtered = excludeId ? teams.filter((t) => t.team_id !== excludeId) : teams;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <View className="rounded-t-3xl bg-white px-5 pb-10 pt-4" style={{ maxHeight: '60%' }}>
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-base font-bold text-neutral-800">{title}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <X size={20} color="#737373" />
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {filtered.map((item) => (
            <Pressable
              key={String(item.team_id)}
              className={`flex-row items-center rounded-xl px-4 py-3 ${selected === item.team_id ? 'bg-amber-500/10' : ''}`}
              onPress={() => { onSelect(item.team_id); onClose(); }}
            >
              <TeamLogo uri={item.logo} size={28} teamName={item.team_name} />
              <Text
                className={`ml-3 text-sm ${selected === item.team_id ? 'font-bold text-amber-600' : 'text-neutral-700'}`}
              >
                {item.team_name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ── 팀 선택 칩 ── */
function TeamChip({
  label,
  team,
  onPress,
}: {
  label: string;
  team: TeamOption | undefined;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={`flex-1 flex-row items-center justify-center rounded-xl border px-3 py-3.5 ${team ? 'border-amber-200 bg-amber-50' : 'border-neutral-200 bg-white'}`}
      onPress={onPress}
    >
      {team ? (
        <>
          <TeamLogo uri={team.logo} size={20} teamName={team.team_name} />
          <Text className="ml-2 text-sm font-semibold text-neutral-800" numberOfLines={1}>
            {team.team_name}
          </Text>
        </>
      ) : (
        <>
          <Text className="text-sm text-neutral-400">{label}</Text>
          <ChevronDown size={14} color="#a3a3a3" style={{ marginLeft: 4 }} />
        </>
      )}
    </Pressable>
  );
}

/* ── 승률 계산 ── */
function getWinPct(wins: number, total: number) {
  if (total === 0) return '0.0';
  return ((wins / total) * 100).toFixed(1);
}

/* ── 결과 카드 ── */
function ResultSection({ stats }: { stats: HeadToHeadStats }) {
  const router = useRouter();

  if (stats.total_matches === 0) {
    return <EmptyState title="맞대결 기록이 없습니다." />;
  }

  return (
    <View style={{ gap: 12 }} className="px-4 pb-8 pt-3">
      {/* 헤더 - 팀 로고 + 승수 */}
      <View className="rounded-2xl border border-neutral-100 bg-white p-5">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 flex-row items-center" style={{ gap: 10 }}>
            <TeamLogo uri={stats.team1_logo} size={44} teamName={stats.team1_name} />
            <Text className="text-[15px] font-bold text-neutral-900" numberOfLines={1}>
              {stats.team1_name}
            </Text>
          </View>

          <View className="items-center px-3">
            <Text className="text-xs text-neutral-400">총 {stats.total_matches}경기</Text>
            <Text className="text-2xl font-bold text-neutral-700" style={NUM}>
              {stats.team1_wins} : {stats.team2_wins}
            </Text>
          </View>

          <View className="flex-1 flex-row items-center justify-end" style={{ gap: 10 }}>
            <Text className="text-[15px] font-bold text-neutral-900" numberOfLines={1}>
              {stats.team2_name}
            </Text>
            <TeamLogo uri={stats.team2_logo} size={44} teamName={stats.team2_name} />
          </View>
        </View>
      </View>

      {/* 통계 요약 4칸 */}
      <View className="flex-row" style={{ gap: 8 }}>
        <View className="flex-1 items-center rounded-2xl border border-neutral-100 bg-white py-3">
          <Text className="text-lg font-bold text-blue-600" style={NUM}>
            {getWinPct(stats.team1_wins, stats.total_matches)}%
          </Text>
          <Text className="text-[10px] text-neutral-400" numberOfLines={1}>{stats.team1_name} 승률</Text>
        </View>
        <View className="flex-1 items-center rounded-2xl border border-neutral-100 bg-white py-3">
          <Text className="text-lg font-bold text-red-500" style={NUM}>
            {getWinPct(stats.team2_wins, stats.total_matches)}%
          </Text>
          <Text className="text-[10px] text-neutral-400" numberOfLines={1}>{stats.team2_name} 승률</Text>
        </View>
      </View>
      <View className="flex-row" style={{ gap: 8 }}>
        <View className="flex-1 items-center rounded-2xl border border-neutral-100 bg-white py-3">
          <Text className="text-lg font-bold text-emerald-600" style={NUM}>
            {stats.team1_goals}:{stats.team2_goals}
          </Text>
          <Text className="text-[10px] text-neutral-400">총 득점</Text>
        </View>
        <View className="flex-1 items-center rounded-2xl border border-neutral-100 bg-white py-3">
          <Text className="text-lg font-bold text-purple-600" style={NUM}>
            {stats.total_matches > 0
              ? ((stats.team1_goals + stats.team2_goals) / stats.total_matches).toFixed(1)
              : '0.0'}
          </Text>
          <Text className="text-[10px] text-neutral-400">경기당 골</Text>
        </View>
      </View>

      {/* 최고 승리 기록 */}
      {(stats.biggest_win_team1 || stats.biggest_win_team2) && (
        <View className="rounded-2xl border border-neutral-100 bg-white p-4">
          <Text className="mb-3 text-sm font-bold text-neutral-800">최고 승리 기록</Text>
          <View style={{ gap: 8 }}>
            {stats.biggest_win_team1 && (
              <View className="rounded-xl bg-blue-50 p-3.5">
                <Text className="text-xs font-semibold text-blue-800">{stats.team1_name}</Text>
                <Text className="mt-0.5 text-xl font-bold text-blue-600" style={NUM}>
                  {stats.biggest_win_team1.score}
                </Text>
                <Text className="mt-0.5 text-xs text-blue-600">
                  {stats.biggest_win_team1.margin}골차 승리 · {stats.biggest_win_team1.season}
                </Text>
                <Text className="mt-0.5 text-[10px] text-blue-400">
                  {stats.biggest_win_team1.match_date}
                </Text>
              </View>
            )}
            {stats.biggest_win_team2 && (
              <View className="rounded-xl bg-red-50 p-3.5">
                <Text className="text-xs font-semibold text-red-800">{stats.team2_name}</Text>
                <Text className="mt-0.5 text-xl font-bold text-red-500" style={NUM}>
                  {stats.biggest_win_team2.score}
                </Text>
                <Text className="mt-0.5 text-xs text-red-500">
                  {stats.biggest_win_team2.margin}골차 승리 · {stats.biggest_win_team2.season}
                </Text>
                <Text className="mt-0.5 text-[10px] text-red-400">
                  {stats.biggest_win_team2.match_date}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* 최근 경기 기록 */}
      {stats.recent_matches.length > 0 && (
        <View className="rounded-2xl border border-neutral-100 bg-white p-4">
          <Text className="mb-3 text-sm font-bold text-neutral-800">최근 경기 기록</Text>
          {stats.recent_matches.map((m, i) => {
            const hasPenalty = m.penalty_home_score != null && m.penalty_away_score != null;
            return (
              <Pressable
                key={m.match_id}
                className={`rounded-lg px-2 py-3 active:bg-neutral-50 ${i < stats.recent_matches.length - 1 ? 'border-b border-neutral-100' : ''}`}
                onPress={() => router.push(`/matches/${m.match_id}`)}
              >
                <View className="flex-row items-center">
                  <View className="w-[52px]">
                    <Text className="text-[11px] text-neutral-400" style={NUM}>
                      {format(new Date(m.match_date), 'yy.MM.dd')}
                    </Text>
                  </View>
                  <View className="flex-1 flex-row items-center justify-center" style={{ gap: 6 }}>
                    <Text className="text-[13px] font-medium text-neutral-700" numberOfLines={1} style={{ maxWidth: 80, textAlign: 'right' }}>
                      {m.home_team_name}
                    </Text>
                    <Text className="text-sm font-bold text-neutral-900" style={NUM}>
                      {m.home_score} - {m.away_score}
                    </Text>
                    <Text className="text-[13px] font-medium text-neutral-700" numberOfLines={1} style={{ maxWidth: 80 }}>
                      {m.away_team_name}
                    </Text>
                  </View>
                </View>
                {/* 승부차기 + 시즌 */}
                <View className="mt-1 flex-row items-center justify-center" style={{ gap: 6 }}>
                  {hasPenalty && (
                    <Text className="text-[10px] font-medium text-amber-600">
                      (PK {m.penalty_home_score}-{m.penalty_away_score})
                    </Text>
                  )}
                  <Text className="text-[10px] text-neutral-400">{m.season_name}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

/* ── 메인 페이지 ── */
export default function HeadToHeadPage() {
  const [team1Id, setTeam1Id] = useState<number | null>(null);
  const [team2Id, setTeam2Id] = useState<number | null>(null);
  const [showTeam1Sheet, setShowTeam1Sheet] = useState(false);
  const [showTeam2Sheet, setShowTeam2Sheet] = useState(false);

  const { data: teams } = useQuery({
    queryKey: ['teamOptions'],
    queryFn: getTeamOptions,
    staleTime: 10 * 60 * 1000,
  });

  const team1 = teams?.find((t) => t.team_id === team1Id);
  const team2 = teams?.find((t) => t.team_id === team2Id);

  const {
    data: stats,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['headToHead', team1Id, team2Id],
    queryFn: () => getHeadToHead(team1Id!, team2Id!),
    enabled: team1Id !== null && team2Id !== null,
  });

  return (
    <>
      <Stack.Screen options={{ title: '상대전적', headerShown: true, headerShadowVisible: false, headerBackButtonDisplayMode: 'minimal' }} />
      <View className="flex-1 bg-neutral-50">
        {/* 팀 선택 */}
        <View className="bg-white px-4 pb-4 pt-3">
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <TeamChip label="팀 1 선택" team={team1} onPress={() => setShowTeam1Sheet(true)} />
            <Text className="text-sm font-bold text-neutral-300">VS</Text>
            <TeamChip label="팀 2 선택" team={team2} onPress={() => setShowTeam2Sheet(true)} />
          </View>
        </View>

        {/* 결과 */}
        {team1Id && team2Id ? (
          isLoading ? (
            <LoadingSpinner />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : stats ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              <ResultSection stats={stats} />
            </ScrollView>
          ) : null
        ) : (
          <EmptyState title="두 팀을 선택하세요." />
        )}
      </View>

      {/* 바텀시트 */}
      <TeamSelectSheet
        visible={showTeam1Sheet}
        onClose={() => setShowTeam1Sheet(false)}
        title="팀 1 선택"
        teams={teams ?? []}
        selected={team1Id}
        excludeId={team2Id}
        onSelect={setTeam1Id}
      />
      <TeamSelectSheet
        visible={showTeam2Sheet}
        onClose={() => setShowTeam2Sheet(false)}
        title="팀 2 선택"
        teams={teams ?? []}
        selected={team2Id}
        excludeId={team1Id}
        onSelect={setTeam2Id}
      />
    </>
  );
}
