import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import {
  getMatchByIdPrisma,
  getMatchGoalsPrisma,
  getMatchLineupsPrisma,
  LineupPlayer,
} from '@/api/matches';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TeamLogo } from '@/components/TeamLogo';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { H3 } from '@/components/ui/Typography';

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

  const { data: goals } = useQuery({
    queryKey: ['matchGoals', id],
    queryFn: () => getMatchGoalsPrisma(id),
    enabled: !!match,
  });

  const { data: lineups } = useQuery({
    queryKey: ['matchLineups', id],
    queryFn: () => getMatchLineupsPrisma(id),
    enabled: !!match,
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError || !match) return <ErrorState onRetry={() => refetch()} />;

  const isCompleted = match.status === 'completed';
  const hasPenalty = match.penalty_home_score !== null && match.penalty_away_score !== null;
  const homeTeam = match.home_team;
  const awayTeam = match.away_team;

  const allPlayers: LineupPlayer[] = lineups ? Object.values(lineups).flat() : [];
  const homeLineups = allPlayers.filter((p) => p.team_id === homeTeam?.team_id);
  const awayLineups = allPlayers.filter((p) => p.team_id === awayTeam?.team_id);

  return (
    <>
      <Stack.Screen
        options={{
          title: `${homeTeam?.team_name ?? ''} vs ${awayTeam?.team_name ?? ''}`,
          headerShown: true,
        }}
      />
      <ScrollView
        className="flex-1 bg-neutral-50"
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => refetch()} />}
      >
        <View className="bg-white px-4 py-6">
          {match.season && (
            <Text className="mb-2 text-center text-xs text-neutral-500">
              {match.season.season_name}
            </Text>
          )}
          <View className="flex-row items-center justify-center">
            <Pressable
              className="flex-1 items-center"
              onPress={() => homeTeam && router.push(`/teams/${homeTeam.team_id}`)}
            >
              <TeamLogo uri={homeTeam?.logo} size={48} teamName={homeTeam?.team_name} />
              <Text className="mt-1 text-center text-sm font-medium text-neutral-900">
                {homeTeam?.team_name}
              </Text>
            </Pressable>

            <View className="mx-4 items-center">
              {isCompleted ? (
                <>
                  <Text className="text-3xl font-bold text-neutral-900">
                    {match.home_score} - {match.away_score}
                  </Text>
                  {hasPenalty && (
                    <Text className="text-xs text-neutral-500">
                      PK {match.penalty_home_score}-{match.penalty_away_score}
                    </Text>
                  )}
                  <Badge variant="default" className="mt-1">
                    종료
                  </Badge>
                </>
              ) : (
                <>
                  <Text className="text-lg font-bold text-neutral-400">vs</Text>
                  {match.match_date && (
                    <Text className="mt-1 text-sm text-neutral-500">
                      {format(new Date(match.match_date), 'yyyy.MM.dd HH:mm')}
                    </Text>
                  )}
                </>
              )}
            </View>

            <Pressable
              className="flex-1 items-center"
              onPress={() => awayTeam && router.push(`/teams/${awayTeam.team_id}`)}
            >
              <TeamLogo uri={awayTeam?.logo} size={48} teamName={awayTeam?.team_name} />
              <Text className="mt-1 text-center text-sm font-medium text-neutral-900">
                {awayTeam?.team_name}
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="gap-3 p-4">
          {goals && goals.length > 0 && (
            <Card>
              <H3 className="mb-2">골</H3>
              {goals.map((g) => (
                <View
                  key={g.goal_id}
                  className="flex-row items-center border-b border-neutral-100 py-2"
                >
                  <Text className="w-8 text-xs text-neutral-500">
                    {g.goal_time ? `${g.goal_time}'` : ''}
                  </Text>
                  <Text className="flex-1 text-sm text-neutral-900">{g.player?.name}</Text>
                  <Text className="text-xs text-neutral-500">{g.team?.team_name}</Text>
                </View>
              ))}
            </Card>
          )}

          {homeLineups.length > 0 && (
            <Card>
              <H3 className="mb-2">{homeTeam?.team_name} 라인업</H3>
              {homeLineups
                .filter((p) => p.participation_status === 'starting')
                .map((p) => (
                  <View key={p.stat_id} className="flex-row items-center py-1">
                    <Text className="w-8 text-center text-xs text-neutral-400">
                      #{p.jersey_number}
                    </Text>
                    <Pressable onPress={() => router.push(`/players/${p.player_id}`)}>
                      <Text className="text-sm text-neutral-900">{p.player_name}</Text>
                    </Pressable>
                    <Badge variant="outline" className="ml-2">
                      {p.position}
                    </Badge>
                  </View>
                ))}
            </Card>
          )}

          {awayLineups.length > 0 && (
            <Card>
              <H3 className="mb-2">{awayTeam?.team_name} 라인업</H3>
              {awayLineups
                .filter((p) => p.participation_status === 'starting')
                .map((p) => (
                  <View key={p.stat_id} className="flex-row items-center py-1">
                    <Text className="w-8 text-center text-xs text-neutral-400">
                      #{p.jersey_number}
                    </Text>
                    <Pressable onPress={() => router.push(`/players/${p.player_id}`)}>
                      <Text className="text-sm text-neutral-900">{p.player_name}</Text>
                    </Pressable>
                    <Badge variant="outline" className="ml-2">
                      {p.position}
                    </Badge>
                  </View>
                ))}
            </Card>
          )}
        </View>
      </ScrollView>
    </>
  );
}
