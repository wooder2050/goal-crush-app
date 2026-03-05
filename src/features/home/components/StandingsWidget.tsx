import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { TeamLogo } from '@/components/TeamLogo';
import { Card } from '@/components/ui/Card';
import type { HomeStanding, StandingsGroup } from '@/features/home/types';

const NUM_STYLE = { fontVariant: ['tabular-nums' as const] };

function FormCircle({ result }: { result: string }) {
  const bg = result === 'W' ? 'bg-emerald-500' : result === 'L' ? 'bg-red-400' : 'bg-neutral-300';
  return (
    <View className={`h-4 w-4 items-center justify-center rounded-full ${bg}`}>
      <Text className="text-[8px] font-bold text-white">{result}</Text>
    </View>
  );
}

/* ── 공통 컬럼 너비 (헤더 · 행 동일하게 적용) ── */
const COL = {
  rank: 'w-6',
  logo: 'w-[22px]',
  mp: 'w-6',
  w: 'w-6',
  l: 'w-6',
  gd: 'w-7',
  pts: 'w-7',
  form: 'w-[88px]',
} as const;

function StandingsRow({ standing, onPress }: { standing: HomeStanding; onPress: () => void }) {
  const form = standing.form ? standing.form.split('') : [];
  const isTopTwo = (standing.position ?? 99) <= 2;

  return (
    <Pressable className="flex-row items-center py-2 active:bg-neutral-50" onPress={onPress}>
      {/* 순위 */}
      <View className={`${COL.rank} items-center justify-center`}>
        <View
          className={`h-5 w-5 items-center justify-center rounded-full ${isTopTwo ? 'bg-primary/10' : ''}`}
        >
          <Text
            className={`text-[10px] font-bold ${isTopTwo ? 'text-primary' : 'text-neutral-400'}`}
          >
            {standing.position}
          </Text>
        </View>
      </View>

      {/* 로고 */}
      <View className={`${COL.logo} ml-1 items-center`}>
        <TeamLogo uri={standing.team?.logo} size={20} teamName={standing.team?.team_name} />
      </View>

      {/* 팀 이름 */}
      <Text className="ml-1.5 flex-1 text-xs font-medium text-neutral-800" numberOfLines={1}>
        {standing.team?.team_name}
      </Text>

      {/* 경기 */}
      <Text className={`${COL.mp} text-center text-[11px] text-neutral-500`} style={NUM_STYLE}>
        {standing.matches_played ?? 0}
      </Text>
      {/* 승 */}
      <Text className={`${COL.w} text-center text-[11px] text-emerald-600`} style={NUM_STYLE}>
        {standing.wins ?? 0}
      </Text>
      {/* 패 */}
      <Text className={`${COL.l} text-center text-[11px] text-red-400`} style={NUM_STYLE}>
        {standing.losses ?? 0}
      </Text>
      {/* 득실 */}
      <Text className={`${COL.gd} text-center text-[11px] text-neutral-400`} style={NUM_STYLE}>
        {(standing.goal_difference ?? 0) > 0 ? '+' : ''}
        {standing.goal_difference ?? 0}
      </Text>
      {/* 승점 */}
      <Text
        className={`${COL.pts} text-center text-xs font-bold text-neutral-900`}
        style={NUM_STYLE}
      >
        {standing.points}
      </Text>
      {/* 최근 */}
      <View className={`${COL.form} flex-row items-center justify-end gap-0.5`}>
        {form.slice(-5).map((r, i) => (
          <FormCircle key={i} result={r} />
        ))}
      </View>
    </Pressable>
  );
}

export function StandingsWidget({
  groups,
  seasonId,
}: {
  groups: StandingsGroup[];
  seasonId?: number;
}) {
  const router = useRouter();

  if (!groups || groups.length === 0) return null;

  return (
    <Card className="p-4">
      <View className="mb-3 flex-row items-center">
        <View className="mr-2 h-4 w-1 rounded-full bg-primary" />
        <Text className="text-base font-bold text-neutral-800">순위표</Text>
      </View>
      {groups.map((group, gi) => (
        <View key={gi}>
          {group.group_name && groups.length > 1 && (
            <Text className="mb-2 mt-3 text-xs font-bold uppercase tracking-wider text-neutral-400">
              {group.group_name}
            </Text>
          )}

          {/* ── 헤더 ── */}
          <View className="flex-row items-center border-b border-neutral-100 pb-1.5">
            <View className={COL.rank} />
            <View className={`${COL.logo} ml-1`} />
            <Text className="ml-1.5 flex-1 text-[10px] font-medium text-neutral-300">팀</Text>
            <Text className={`${COL.mp} text-center text-[10px] font-medium text-neutral-300`}>
              경기
            </Text>
            <Text className={`${COL.w} text-center text-[10px] font-medium text-neutral-300`}>
              승
            </Text>
            <Text className={`${COL.l} text-center text-[10px] font-medium text-neutral-300`}>
              패
            </Text>
            <Text className={`${COL.gd} text-center text-[10px] font-medium text-neutral-300`}>
              득실
            </Text>
            <Text className={`${COL.pts} text-center text-[10px] font-medium text-neutral-300`}>
              승점
            </Text>
            <Text className={`${COL.form} text-right text-[10px] font-medium text-neutral-300`}>
              최근
            </Text>
          </View>

          {group.standings.map((s) => (
            <StandingsRow
              key={s.standing_id}
              standing={s}
              onPress={() => {
                if (s.team?.team_id != null) {
                  router.push(`/teams/${s.team.team_id}`);
                }
              }}
            />
          ))}
        </View>
      ))}

      {/* 전체 보기 */}
      {seasonId && (
        <Pressable
          className="mt-3 flex-row items-center justify-center rounded-xl bg-neutral-50 py-2.5 active:bg-neutral-100"
          onPress={() => router.push(`/seasons/${seasonId}?tab=standings`)}
        >
          <Text className="text-[13px] font-semibold text-neutral-500">전체 순위 보기</Text>
          <ChevronRight size={14} color="#a3a3a3" style={{ marginLeft: 2 }} />
        </Pressable>
      )}
    </Card>
  );
}
