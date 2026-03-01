import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { TeamLogo } from '@/components/TeamLogo';
import { Card } from '@/components/ui/Card';
import { H3 } from '@/components/ui/Typography';
import type { HomeStanding, StandingsGroup } from '@/features/home/types';

function FormCircle({ result }: { result: string }) {
  const bg = result === 'W' ? 'bg-green-500' : result === 'L' ? 'bg-red-500' : 'bg-neutral-300';
  return (
    <View className={`h-4 w-4 items-center justify-center rounded-full ${bg}`}>
      <Text className="text-[8px] font-bold text-white">{result}</Text>
    </View>
  );
}

function StandingsRow({ standing, onPress }: { standing: HomeStanding; onPress: () => void }) {
  const form = standing.form ? standing.form.split('') : [];
  return (
    <Pressable
      className="flex-row items-center border-b border-neutral-100 py-2 active:bg-neutral-50"
      onPress={onPress}
    >
      <Text className="w-6 text-center text-xs text-neutral-500">{standing.position}</Text>
      <TeamLogo uri={standing.team?.logo} size={20} teamName={standing.team?.team_name} />
      <Text className="ml-2 flex-1 text-sm text-neutral-900" numberOfLines={1}>
        {standing.team?.team_name}
      </Text>
      <Text className="w-8 text-center text-xs text-neutral-500">
        {(standing.goal_difference ?? 0) > 0 ? '+' : ''}
        {standing.goal_difference ?? 0}
      </Text>
      <Text className="w-8 text-center text-sm font-bold text-neutral-900">{standing.points}</Text>
      <View className="ml-1 w-20 flex-row items-center justify-end gap-0.5">
        {form.slice(-5).map((r, i) => (
          <FormCircle key={i} result={r} />
        ))}
      </View>
    </Pressable>
  );
}

export function StandingsWidget({ groups }: { groups: StandingsGroup[] }) {
  const router = useRouter();

  if (!groups || groups.length === 0) return null;

  return (
    <Card>
      <H3 className="mb-3">순위표</H3>
      {groups.map((group, gi) => (
        <View key={gi}>
          {group.group_name && groups.length > 1 && (
            <Text className="mb-1 mt-2 text-xs font-semibold text-neutral-500">
              {group.group_name}
            </Text>
          )}
          <View className="flex-row border-b border-neutral-200 pb-1">
            <Text className="w-6 text-center text-[10px] text-neutral-400">#</Text>
            <Text className="flex-1 pl-6 text-[10px] text-neutral-400">팀</Text>
            <Text className="w-8 text-center text-[10px] text-neutral-400">득실</Text>
            <Text className="w-8 text-center text-[10px] text-neutral-400">승점</Text>
            <Text className="w-20 text-right text-[10px] text-neutral-400">최근</Text>
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
    </Card>
  );
}
