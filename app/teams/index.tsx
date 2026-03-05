import { useQuery } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';

import { getTeamsPrisma } from '@/api/teams';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TeamLogo } from '@/components/TeamLogo';
import { Card } from '@/components/ui/Card';
import type { TeamWithExtras } from '@/features/teams/types';

/* ─── helpers ─────────────────────────────────────────────── */

const NUM = { fontVariant: ['tabular-nums' as const] };

function inferLeague(seasonName: string | null): string {
  if (!seasonName) return 'other';
  const name = seasonName.toLowerCase();
  if (name.includes('champion') || name.includes('챔피언')) return 'cup';
  if (name.includes('sbs') || name.includes('cup') || name.includes('컵')) return 'cup';
  return 'league';
}

/* ─── Team Card ───────────────────────────────────────────── */

function TeamCard({ team, rank }: { team: TeamWithExtras; rank: number }) {
  const router = useRouter();
  const championships = team.championships ?? [];
  const totalWins = championships.length;
  const cupWins = championships.filter((c) => inferLeague(c.season_name) === 'cup').length;
  const leagueWins = Math.max(totalWins - cupWins, 0);
  const hasWins = leagueWins > 0 || cupWins > 0;

  return (
    <Pressable
      onPress={() => router.push(`/teams/${team.team_id}`)}
      className="active:scale-[0.98]"
      style={{ flex: 1 }}
    >
      <Card className="flex-1 overflow-hidden p-0">
        {/* Rank indicator - top-left corner */}
        {rank <= 3 && (
          <View
            className="absolute left-0 top-0 z-10 rounded-br-xl rounded-tl-2xl px-2.5 py-1"
            style={{
              backgroundColor: rank === 1 ? '#fbbf24' : rank === 2 ? '#d1d5db' : '#fb923c',
            }}
          >
            <Text className="text-[10px] font-extrabold text-white" style={NUM}>
              {rank}
            </Text>
          </View>
        )}

        {/* Logo section */}
        <View className="items-center px-3 pb-1 pt-5">
          <View
            className="items-center justify-center rounded-full bg-white"
            style={{
              width: 72,
              height: 72,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <TeamLogo uri={team.logo} size={64} teamName={team.team_name} />
          </View>
        </View>

        {/* Info section */}
        <View className="items-center px-3 pb-4 pt-2">
          <Text className="text-center text-[13px] font-bold text-neutral-900" numberOfLines={1}>
            {team.team_name}
          </Text>

          {team.founded_year ? (
            <Text className="mt-0.5 text-[10px] text-neutral-400" style={NUM}>
              {team.founded_year}년 창단
            </Text>
          ) : (
            <View style={{ height: 14 }} />
          )}

          {/* Championship badges */}
          {hasWins ? (
            <View className="mt-2 flex-row flex-wrap justify-center" style={{ gap: 3 }}>
              {leagueWins > 0 && (
                <View
                  className="flex-row items-center rounded-full bg-amber-50 px-2 py-0.5"
                  style={{ gap: 2 }}
                >
                  <Text className="text-[9px]">⭐</Text>
                  <Text className="text-[9px] font-bold text-amber-700" style={NUM}>
                    리그 {leagueWins}
                  </Text>
                </View>
              )}
              {cupWins > 0 && (
                <View
                  className="flex-row items-center rounded-full bg-primary/8 px-2 py-0.5"
                  style={{ gap: 2 }}
                >
                  <Text className="text-[9px]">🏆</Text>
                  <Text className="text-[9px] font-bold text-primary" style={NUM}>
                    컵 {cupWins}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={{ height: 20 }} />
          )}
        </View>
      </Card>
    </Pressable>
  );
}

/* ─── Main Screen ─────────────────────────────────────────── */

export default function TeamsScreen() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['teamsAll'],
    queryFn: getTeamsPrisma,
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const teams = (data ?? []).sort((a: TeamWithExtras, b: TeamWithExtras) => {
    const ca = a.championships_count ?? 0;
    const cb = b.championships_count ?? 0;
    if (cb !== ca) return cb - ca;
    return a.team_name.localeCompare(b.team_name);
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: '팀',
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
        }}
      />
      <FlatList
        className="flex-1 bg-neutral-50"
        data={teams}
        numColumns={2}
        keyExtractor={(item) => String(item.team_id)}
        renderItem={({ item, index }) => (
          <View className="w-1/2 px-1.5">
            <TeamCard team={item} rank={index + 1} />
          </View>
        )}
        columnWrapperStyle={{ paddingHorizontal: 12, marginBottom: 10 }}
        contentContainerStyle={{ paddingTop: 14, paddingBottom: 32 }}
        ListHeaderComponent={
          <View className="mb-2 px-4">
            <Text className="text-[13px] text-neutral-400">우승 횟수 순</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </>
  );
}
