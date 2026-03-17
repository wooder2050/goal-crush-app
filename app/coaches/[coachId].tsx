import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { fetchCoachFull } from '@/api/coaches';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TeamLogo } from '@/components/TeamLogo';
import { Card } from '@/components/ui/Card';
import type { CoachSeasonStats } from '@/lib/types';
import { sanitizeLabel } from '@/lib/utils';

const NUM = { fontVariant: ['tabular-nums' as const] };

/* ─── Section Header ──────────────────────────────────────── */

function SectionHeader({ title }: { title: string }) {
  return (
    <View className="mb-4 flex-row items-center">
      <View className="mr-2 h-4 w-1 rounded-full bg-primary" />
      <Text className="text-base font-bold text-neutral-800">{title}</Text>
    </View>
  );
}

/* ─── Hero Header ─────────────────────────────────────────── */

function HeroHeader({
  coach,
  currentTeam,
  trophyCount,
  router,
}: {
  coach: { name: string; profile_image_url: string | null; nationality: string | null };
  currentTeam: { team_id: number; team_name: string; logo: string | null } | null;
  trophyCount: number;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <View className="overflow-hidden bg-white">
      <View
        className="absolute left-0 right-0 top-0 bg-primary"
        style={{ height: 120, opacity: 0.04 }}
      />

      <View className="items-center px-5 pb-5 pt-6">
        {/* Photo — tall rectangle for upper-body */}
        {coach.profile_image_url ? (
          <View
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <Image
              source={{ uri: coach.profile_image_url }}
              style={{ width: 96, height: 120, borderRadius: 16 }}
              contentFit="cover"
              contentPosition="top"
              transition={200}
            />
          </View>
        ) : (
          <View
            className="items-center justify-center rounded-2xl bg-neutral-100"
            style={{ width: 96, height: 120 }}
          >
            <Text className="text-3xl font-bold text-neutral-300">{coach.name?.charAt(0)}</Text>
          </View>
        )}

        {/* Trophy pill */}
        {trophyCount > 0 && (
          <View
            className="mt-2.5 flex-row items-center rounded-full bg-amber-50 px-3 py-1"
            style={{ gap: 4 }}
          >
            <Text className="text-xs">🏆</Text>
            <Text className="text-xs font-bold text-amber-700" style={NUM}>
              {trophyCount}회 우승
            </Text>
          </View>
        )}

        <Text className="mt-3 text-xl font-bold tracking-tight text-neutral-900">{coach.name}</Text>

        {coach.nationality && (
          <Text className="mt-1 text-[13px] text-neutral-400">{coach.nationality}</Text>
        )}

        {currentTeam ? (
          <Pressable
            className="mt-2 flex-row items-center"
            style={{ gap: 5 }}
            onPress={() => router.push(`/teams/${currentTeam.team_id}`)}
          >
            <TeamLogo uri={currentTeam.logo} size={20} teamName={currentTeam.team_name} />
            <Text className="text-[13px] font-medium text-primary">{currentTeam.team_name}</Text>
          </Pressable>
        ) : (
          <Text className="mt-2 text-[13px] text-neutral-400">맡은 팀 없음</Text>
        )}
      </View>
    </View>
  );
}

/* ─── Stats Card ──────────────────────────────────────────── */

function StatsCard({
  totalMatches,
  totalWins,
  totalDraws,
  totalLosses,
}: {
  totalMatches: number;
  totalWins: number;
  totalDraws: number;
  totalLosses: number;
}) {
  const total = totalWins + totalLosses;
  const winPct = total > 0 ? totalWins / total : 0;
  const winRate = total > 0 ? Math.round((totalWins / total) * 100) : 0;

  return (
    <View>
      <SectionHeader title="통산 성적" />
      <Card className="p-5">
        {/* Win rate hero */}
        <View className="mb-4 items-center">
          <Text className="text-3xl font-extrabold text-primary" style={NUM}>
            {winRate}%
          </Text>
          <Text className="mt-0.5 text-[11px] font-medium text-neutral-400">승률</Text>

          <View className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <View
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.min(winPct * 100, 100)}%` }}
            />
          </View>
          <View className="mt-1 w-full flex-row justify-between">
            <Text className="text-[10px] text-emerald-500" style={NUM}>
              {totalWins}승
            </Text>
            <Text className="text-[10px] text-neutral-400" style={NUM}>
              {totalDraws}무
            </Text>
            <Text className="text-[10px] text-red-400" style={NUM}>
              {totalLosses}패
            </Text>
          </View>
        </View>

        {/* Stats grid */}
        <View className="flex-row" style={{ gap: 8 }}>
          <StatCell label="경기" value={totalMatches} />
          <StatCell label="승" value={totalWins} accent="text-emerald-600" />
          <StatCell label="무" value={totalDraws} />
          <StatCell label="패" value={totalLosses} accent="text-red-500" />
        </View>
      </Card>
    </View>
  );
}

function StatCell({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <View className="flex-1 items-center rounded-xl bg-neutral-50 py-2.5">
      <Text className="text-[10px] font-medium text-neutral-400">{label}</Text>
      <Text className={`mt-0.5 text-base font-bold ${accent ?? 'text-neutral-900'}`} style={NUM}>
        {value}
      </Text>
    </View>
  );
}

/* ─── Trophies Section ────────────────────────────────────── */

function TrophiesSection({
  trophies,
}: {
  trophies: {
    total: number;
    league_wins: number;
    cup_wins: number;
    items: Array<{ season_id: number; season_name: string }>;
  };
}) {
  if (trophies.total === 0) return null;

  return (
    <View>
      <SectionHeader title="우승 기록" />
      <Card className="p-5">
        {/* Summary pills */}
        <View className="mb-3 flex-row" style={{ gap: 8 }}>
          {trophies.league_wins > 0 && (
            <View
              className="flex-row items-center rounded-full bg-amber-50 px-3 py-1"
              style={{ gap: 4 }}
            >
              <Text className="text-[11px]">⭐</Text>
              <Text className="text-[11px] font-bold text-amber-700" style={NUM}>
                리그 {trophies.league_wins}회
              </Text>
            </View>
          )}
          {trophies.cup_wins > 0 && (
            <View
              className="flex-row items-center rounded-full bg-primary/10 px-3 py-1"
              style={{ gap: 4 }}
            >
              <Text className="text-[11px]">🏆</Text>
              <Text className="text-[11px] font-bold text-primary" style={NUM}>
                컵 {trophies.cup_wins}회
              </Text>
            </View>
          )}
        </View>

        {/* Season badges */}
        <View className="flex-row flex-wrap" style={{ gap: 4 }}>
          {trophies.items.map((t, i) => (
            <View
              key={i}
              className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5"
            >
              <Text className="text-[10px] font-semibold text-amber-800">
                🏆 {sanitizeLabel(t.season_name)}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}

/* ─── Season Stats Section ────────────────────────────────── */

function SeasonStatsSection({ seasonStats }: { seasonStats: CoachSeasonStats[] }) {
  if (!seasonStats || seasonStats.length === 0) return null;

  return (
    <View>
      <SectionHeader title="시즌별 기록" />
      <Card className="overflow-hidden p-0">
        {seasonStats.map((s, idx) => {
          const isLast = idx === seasonStats.length - 1;
          const gd = s.goal_difference;

          return (
            <View
              key={s.season_id}
              className={`px-4 py-3.5 ${isLast ? '' : 'border-b border-neutral-50'}`}
            >
              {/* Top row: season name + win rate */}
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 text-[13px] font-bold text-neutral-800" numberOfLines={1}>
                  {sanitizeLabel(s.season_name)}
                </Text>
                <View className="rounded-full bg-primary/10 px-2.5 py-0.5">
                  <Text className="text-[11px] font-bold text-primary" style={NUM}>
                    {s.win_rate}%
                  </Text>
                </View>
              </View>

              {/* Teams */}
              {s.teams_detailed && s.teams_detailed.length > 0 && (
                <View className="mt-1.5 flex-row" style={{ gap: 8 }}>
                  {s.teams_detailed.map((t) => (
                    <View key={t.team_id} className="flex-row items-center" style={{ gap: 3 }}>
                      <TeamLogo uri={t.logo} size={14} teamName={t.team_name} />
                      <Text className="text-[11px] text-neutral-500">{t.team_name}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Stats row */}
              <View className="mt-2 flex-row items-center" style={{ gap: 6 }}>
                <View className="rounded-md bg-neutral-50 px-2 py-0.5">
                  <Text className="text-[10px] font-semibold text-neutral-500" style={NUM}>
                    {s.matches_played}경기
                  </Text>
                </View>
                <Text className="text-[10px] text-emerald-500" style={NUM}>
                  {s.wins}승
                </Text>
                <Text className="text-[10px] text-neutral-400" style={NUM}>
                  {s.draws}무
                </Text>
                <Text className="text-[10px] text-red-400" style={NUM}>
                  {s.losses}패
                </Text>
                <Text
                  className={`ml-auto text-[10px] font-semibold ${gd > 0 ? 'text-emerald-500' : gd < 0 ? 'text-red-400' : 'text-neutral-400'}`}
                  style={NUM}
                >
                  득실 {gd > 0 ? `+${gd}` : gd}
                </Text>
              </View>

              {/* Position if available */}
              {s.position && (
                <View className="mt-1.5">
                  <Text className="text-[10px] text-neutral-400" style={NUM}>
                    최종 순위 {s.position}위
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </Card>
    </View>
  );
}

/* ─── Main Screen ─────────────────────────────────────────── */

export default function CoachDetailScreen() {
  const { coachId } = useLocalSearchParams<{ coachId: string }>();
  const router = useRouter();
  const id = Number(coachId);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['coachFull', id],
    queryFn: () => fetchCoachFull(id),
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  const { coach, overview, current_team_verified } = data;

  const totalWins = overview.season_stats?.reduce((s, r) => s + r.wins, 0) ?? 0;
  const totalDraws = overview.season_stats?.reduce((s, r) => s + r.draws, 0) ?? 0;
  const totalLosses = overview.season_stats?.reduce((s, r) => s + r.losses, 0) ?? 0;

  return (
    <>
      <Stack.Screen
        options={{
          title: coach.name,
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
        {/* Hero */}
        <HeroHeader
          coach={coach}
          currentTeam={current_team_verified}
          trophyCount={overview.trophies?.total ?? 0}
          router={router}
        />

        {/* Content */}
        <View className="px-4 pb-12 pt-5" style={{ gap: 20 }}>
          <StatsCard
            totalMatches={overview.total_matches}
            totalWins={totalWins}
            totalDraws={totalDraws}
            totalLosses={totalLosses}
          />

          {overview.trophies && <TrophiesSection trophies={overview.trophies} />}

          {overview.season_stats && <SeasonStatsSection seasonStats={overview.season_stats} />}
        </View>
      </ScrollView>
    </>
  );
}
