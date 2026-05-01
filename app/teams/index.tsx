import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { getTeamsPrisma } from '@/api/teams';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { TeamWithExtras } from '@/features/teams/types';
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

function inferLeague(seasonName: string | null): string {
  if (!seasonName) return 'other';
  const n = seasonName.toLowerCase();
  if (n.includes('슈퍼') || n.includes('super') || n.includes('파일럿') || n.includes('시즌 1'))
    return 'super';
  if (n.includes('g리그') || n.includes('g-league') || n.includes('조별')) return 'g-league';
  if (
    n.includes('champion') ||
    n.includes('챔피언') ||
    n.includes('sbs') ||
    n.includes('cup') ||
    n.includes('컵')
  )
    return 'cup';
  return 'other';
}

function TeamCard({ team }: { team: TeamWithExtras }) {
  const router = useRouter();

  const primaryColor = team.primary_color ?? '#1F2937';
  const headerBg = isLightColor(primaryColor)
    ? team.secondary_color && !isLightColor(team.secondary_color)
      ? team.secondary_color
      : '#1F2937'
    : primaryColor;
  const light = isLightColor(headerBg);
  const headerText = light ? '#111827' : '#FFFFFF';
  const headerSub = light ? '#4B5563' : 'rgba(255,255,255,0.7)';

  const championships = team.championships ?? [];
  const leagueWins = championships.filter((c) => {
    const league = inferLeague(c.season_name ?? null);
    return league === 'super' || league === 'g-league';
  });
  const cupWins = championships.filter((c) => {
    const league = inferLeague(c.season_name ?? null);
    return league === 'cup';
  });
  const totalWins = leagueWins.length + cupWins.length;
  const reps = (team.representative_players ?? []).slice(0, 2);

  return (
    <Pressable
      className="overflow-hidden rounded-2xl border border-neutral-100 bg-white active:scale-[0.98]"
      onPress={() => router.push(`/teams/${team.team_id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${team.team_name} 팀 상세보기`}
    >
      {/* 팀색 배너 + 로고 + 이름 + 우승 요약 */}
      <View
        className="flex-row items-center px-4 py-3.5"
        style={{
          backgroundColor: headerBg,
          gap: 10,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }}
      >
        {/* 로고 - 팀 색상 링 보존 */}
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            borderWidth: 2,
            borderColor: light ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.6)',
            backgroundColor: '#fff',
            overflow: 'hidden',
          }}
        >
          {team.logo ? (
            <Image
              source={{ uri: team.logo }}
              style={{ width: 42, height: 42, borderRadius: 21 }}
              contentFit="cover"
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: headerBg, fontSize: 16, fontWeight: 'bold' }}>
                {team.team_name?.charAt(0)}
              </Text>
            </View>
          )}
        </View>

        {/* 팀명 + 창단년도 */}
        <View className="min-w-0 flex-1">
          <Text style={{ color: headerText, fontSize: 16, fontWeight: '600' }} numberOfLines={1}>
            {team.team_name}
          </Text>
          <Text style={{ color: headerSub, fontSize: 12, marginTop: 1 }}>
            {team.founded_year ? `${team.founded_year}년 창단` : ''}
          </Text>
        </View>

        {/* 우승 요약 칩 (단순화) */}
        {totalWins > 0 && (
          <View
            style={{
              backgroundColor: 'rgba(0,0,0,0.25)',
              borderRadius: 12,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
              {leagueWins.length > 0 && `⭐${leagueWins.length}`}
              {leagueWins.length > 0 && cupWins.length > 0 && ' '}
              {cupWins.length > 0 && `🏆${cupWins.length}`}
            </Text>
          </View>
        )}
      </View>

      {/* 정보 영역 - 고정 높이로 일관성 확보 */}
      <View className="px-4 py-3.5" style={{ minHeight: 120 }}>
        {/* 우승 요약 (1줄 제한) */}
        {championships.length > 0 ? (
          <View className="flex-row flex-wrap" style={{ gap: 4 }}>
            {leagueWins.slice(0, 3).map((c) => (
              <View
                key={c.season_id}
                className="flex-row items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5"
                style={{ gap: 2 }}
              >
                <Text style={{ fontSize: 10 }}>⭐</Text>
                <Text style={{ fontSize: 10, fontWeight: '500', color: '#92400E' }}>
                  {sanitizeLabel(c.season_name ?? '')}
                </Text>
              </View>
            ))}
            {cupWins.slice(0, 2).map((c) => (
              <View
                key={c.season_id}
                className="flex-row items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5"
                style={{ gap: 2 }}
              >
                <Text style={{ fontSize: 10 }}>🏆</Text>
                <Text style={{ fontSize: 10, fontWeight: '500', color: '#5B21B6' }}>
                  {sanitizeLabel(c.season_name ?? '')}
                </Text>
              </View>
            ))}
            {championships.length > 5 && (
              <View className="rounded-full bg-neutral-100 px-2 py-0.5">
                <Text style={{ fontSize: 10, fontWeight: '500', color: '#6B7280' }}>
                  +{championships.length - 5}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={{ fontSize: 11, color: '#9CA3AF' }}>우승 기록 없음</Text>
        )}

        {/* 대표 선수 (최대 2명, 하단 고정) */}
        {reps.length > 0 && (
          <View className="mt-auto pt-3" style={{ gap: 8 }}>
            {reps.map((p) => {
              const role = (p as { role?: string }).role ?? 'appearances';
              const statLabel =
                role === 'goals'
                  ? `${p.goals ?? 0}골`
                  : role === 'assists'
                    ? `${p.assists ?? 0}도움`
                    : `${p.appearances}경기`;
              const roleLabel =
                role === 'goals' ? '최다 득점' : role === 'assists' ? '최다 도움' : '최다 출전';
              return (
                <View
                  key={`${p.player_id}-${role}`}
                  className="flex-row items-center"
                  style={{ gap: 8 }}
                >
                  {p.profile_image_url ? (
                    <Image
                      source={{ uri: p.profile_image_url }}
                      style={{ width: 30, height: 30, borderRadius: 15 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 15,
                        backgroundColor: '#F3F4F6',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '500', color: '#9CA3AF' }}>
                        {p.name.charAt(0)}
                      </Text>
                    </View>
                  )}
                  <View className="min-w-0 flex-1">
                    <Text
                      style={{ fontSize: 13, fontWeight: '500', color: '#1F2937' }}
                      numberOfLines={1}
                    >
                      {p.name}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#9CA3AF' }}>{roleLabel}</Text>
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', ...NUM }}>
                    {statLabel}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function TeamsScreen() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['teamsAll'],
    queryFn: getTeamsPrisma,
  });

  const teams = useMemo(() => {
    if (!Array.isArray(data)) return [];

    let maxSeasonId = 0;
    for (const t of data) {
      for (const ts of t.team_seasons ?? []) {
        const sid = ts.season?.season_id ?? 0;
        if (sid > maxSeasonId) maxSeasonId = sid;
      }
    }

    return [...data].sort((a: TeamWithExtras, b: TeamWithExtras) => {
      const aInCurrent = (a.team_seasons ?? []).some((ts) => ts.season?.season_id === maxSeasonId);
      const bInCurrent = (b.team_seasons ?? []).some((ts) => ts.season?.season_id === maxSeasonId);
      if (aInCurrent !== bInCurrent) return aInCurrent ? -1 : 1;
      const ca = a.championships_count ?? 0;
      const cb = b.championships_count ?? 0;
      if (cb !== ca) return cb - ca;
      return a.team_name.localeCompare(b.team_name);
    });
  }, [data]);

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <>
      <Stack.Screen
        options={{
          title: '팀 목록',
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
        }}
      />
      <FlatList
        className="flex-1 bg-neutral-50"
        data={teams}
        keyExtractor={(item) => String(item.team_id)}
        renderItem={({ item }) => (
          <View className="px-4 pb-3">
            <TeamCard team={item} />
          </View>
        )}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }}
        ListHeaderComponent={
          <View className="mb-2 px-4">
            <Text style={{ fontSize: 12, color: '#9CA3AF' }}>총 {teams.length}팀</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </>
  );
}
