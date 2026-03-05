import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowUp, ChevronRight, Medal } from 'lucide-react-native';
import { FlatList, Text, View } from 'react-native';

import { getSeasonsPagePrisma, SeasonWithStats } from '@/api/seasons';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TeamLogo } from '@/components/TeamLogo';
import { Badge } from '@/components/ui/Badge';
import { PressableCard } from '@/components/ui/Card';

function getSeasonStatus(season: SeasonWithStats): {
  label: string;
  variant: 'success' | 'default' | 'warning';
} {
  if (season.end_date) {
    return { label: '완료', variant: 'default' };
  }
  if (season.start_date || (season.match_count ?? 0) > 0) {
    return { label: '진행중', variant: 'success' };
  }
  return { label: '예정', variant: 'warning' };
}

function ChampionSection({ season }: { season: SeasonWithStats }) {
  const label = season.champion_label;
  if (!label) return null;

  const teams = season.champion_teams ?? [];
  const displayTeams =
    teams.length > 0
      ? teams
      : season.champion_team_name
        ? [
            {
              team_id: season.champion_team_id ?? null,
              team_name: season.champion_team_name,
              logo: season.champion_team_logo ?? null,
            },
          ]
        : [];

  if (displayTeams.length === 0) return null;

  const isPromotion = label === '승격팀';

  return (
    <View className="mt-3 rounded-lg bg-amber-50/60 px-3 py-2.5">
      <View className="mb-1.5 flex-row items-center">
        {isPromotion ? <ArrowUp size={12} color="#d97706" /> : <Medal size={12} color="#d97706" />}
        <Text className="ml-1 text-[11px] font-bold text-amber-600">{label}</Text>
      </View>
      {displayTeams.map((team, i) => (
        <View key={team.team_id ?? i} className={`flex-row items-center ${i > 0 ? 'mt-1.5' : ''}`}>
          <TeamLogo uri={team.logo} size={18} teamName={team.team_name ?? undefined} />
          <Text className="ml-2 text-sm font-semibold text-amber-800" numberOfLines={1}>
            {team.team_name}
          </Text>
        </View>
      ))}
    </View>
  );
}

function SeasonCard({ season }: { season: SeasonWithStats }) {
  const router = useRouter();
  const status = getSeasonStatus(season);
  const matchCount = season.match_count ?? 0;

  return (
    <PressableCard
      className="mx-5 mb-3"
      onPress={() => router.push(`/seasons/${season.season_id}`)}
    >
      {/* 헤더: 시즌명 + 상태 + 화살표 */}
      <View className="flex-row items-center">
        <View className="min-w-0 flex-1">
          <Text className="text-base font-bold text-neutral-900" numberOfLines={1}>
            {season.season_name}
          </Text>
        </View>
        <Badge variant={status.variant} className="ml-2">
          {status.label}
        </Badge>
        <ChevronRight size={16} color="#d4d4d4" style={{ marginLeft: 4 }} />
      </View>

      {/* 메타: 연도 + 경기수 */}
      <View className="mt-1.5 flex-row items-center gap-3">
        <Text className="text-xs text-neutral-400">{season.year}년</Text>
        {matchCount > 0 && <Text className="text-xs text-neutral-400">⚽ {matchCount}경기</Text>}
      </View>

      {/* 우승팀/승격팀 */}
      <ChampionSection season={season} />
    </PressableCard>
  );
}

export default function SeasonsScreen() {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['seasonsPage'],
      queryFn: ({ pageParam }) => getSeasonsPagePrisma(pageParam as number, 10),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextPage,
    });

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const seasons = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <FlatList
      className="flex-1 bg-neutral-50"
      data={seasons}
      keyExtractor={(item) => String(item.season_id)}
      renderItem={({ item }) => <SeasonCard season={item} />}
      contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
      onEndReached={() => hasNextPage && fetchNextPage()}
      onEndReachedThreshold={0.5}
      showsVerticalScrollIndicator={false}
      ListFooterComponent={isFetchingNextPage ? <LoadingSpinner size="small" /> : null}
    />
  );
}
