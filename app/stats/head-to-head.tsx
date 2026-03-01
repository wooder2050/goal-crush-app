import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { getHeadToHead, getTeamOptions, HeadToHeadStats, TeamOption } from '@/api/stats';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TeamLogo } from '@/components/TeamLogo';
import { Card } from '@/components/ui/Card';
import { H3 } from '@/components/ui/Typography';

function TeamSelector({
  teams,
  selectedId,
  onSelect,
  label,
}: {
  teams: TeamOption[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  label: string;
}) {
  return (
    <View className="flex-1">
      <Text className="mb-1 text-xs text-neutral-500">{label}</Text>
      <ScrollView className="max-h-40 rounded-lg border border-neutral-200 bg-white">
        {teams.map((t) => (
          <Pressable
            key={t.team_id}
            className={`flex-row items-center px-3 py-2 ${selectedId === t.team_id ? 'bg-primary/10' : ''}`}
            onPress={() => onSelect(t.team_id)}
          >
            <TeamLogo uri={t.logo} size={20} teamName={t.team_name} />
            <Text
              className={`ml-2 text-sm ${selectedId === t.team_id ? 'font-bold text-primary' : 'text-neutral-700'}`}
              numberOfLines={1}
            >
              {t.team_name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function StatsCard({ stats }: { stats: HeadToHeadStats }) {
  return (
    <View className="gap-3 p-4">
      <Card>
        <View className="flex-row items-center justify-around">
          <View className="items-center">
            <TeamLogo uri={stats.team1_logo} size={40} teamName={stats.team1_name} />
            <Text className="mt-1 text-sm font-semibold text-neutral-900">{stats.team1_name}</Text>
            <Text className="text-2xl font-bold text-green-600">{stats.team1_wins}</Text>
            <Text className="text-xs text-neutral-500">승</Text>
          </View>
          <View className="items-center">
            <Text className="text-lg font-bold text-neutral-400">{stats.draws}</Text>
            <Text className="text-xs text-neutral-500">무</Text>
            <Text className="mt-2 text-sm text-neutral-500">{stats.total_matches}경기</Text>
          </View>
          <View className="items-center">
            <TeamLogo uri={stats.team2_logo} size={40} teamName={stats.team2_name} />
            <Text className="mt-1 text-sm font-semibold text-neutral-900">{stats.team2_name}</Text>
            <Text className="text-2xl font-bold text-green-600">{stats.team2_wins}</Text>
            <Text className="text-xs text-neutral-500">승</Text>
          </View>
        </View>
        <View className="mt-3 flex-row justify-center gap-8">
          <View className="items-center">
            <Text className="text-lg font-bold text-neutral-900">{stats.team1_goals}</Text>
            <Text className="text-xs text-neutral-500">골</Text>
          </View>
          <View className="items-center">
            <Text className="text-lg font-bold text-neutral-900">{stats.team2_goals}</Text>
            <Text className="text-xs text-neutral-500">골</Text>
          </View>
        </View>
      </Card>

      {stats.recent_matches.length > 0 && (
        <Card>
          <H3 className="mb-2">최근 경기</H3>
          {stats.recent_matches.map((m) => (
            <View
              key={m.match_id}
              className="flex-row items-center border-b border-neutral-100 py-2"
            >
              <Text className="w-20 text-xs text-neutral-500">
                {format(new Date(m.match_date), 'yyyy.MM.dd')}
              </Text>
              <Text className="flex-1 text-center text-sm text-neutral-900">
                {m.home_team_name} {m.home_score} - {m.away_score} {m.away_team_name}
              </Text>
            </View>
          ))}
        </Card>
      )}
    </View>
  );
}

export default function HeadToHeadPage() {
  const [team1Id, setTeam1Id] = useState<number | null>(null);
  const [team2Id, setTeam2Id] = useState<number | null>(null);

  const { data: teams } = useQuery({
    queryKey: ['teamOptions'],
    queryFn: getTeamOptions,
  });

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
      <Stack.Screen options={{ title: '상대전적', headerShown: true }} />
      <ScrollView className="flex-1 bg-neutral-50">
        <View className="flex-row gap-3 p-4">
          <TeamSelector
            teams={teams ?? []}
            selectedId={team1Id}
            onSelect={setTeam1Id}
            label="팀 1"
          />
          <TeamSelector
            teams={teams ?? []}
            selectedId={team2Id}
            onSelect={setTeam2Id}
            label="팀 2"
          />
        </View>

        {team1Id && team2Id ? (
          isLoading ? (
            <LoadingSpinner />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : stats ? (
            <StatsCard stats={stats} />
          ) : null
        ) : (
          <View className="items-center py-16">
            <Text className="text-sm text-neutral-500">두 팀을 선택하세요.</Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}
