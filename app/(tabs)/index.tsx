import { useQuery } from '@tanstack/react-query';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

import { fetchHomePageData } from '@/api/home';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { MatchesWidget } from '@/features/home/components/MatchesWidget';
import { PlayerStatsWidget } from '@/features/home/components/PlayerStatsWidget';
import { StandingsWidget } from '@/features/home/components/StandingsWidget';

export default function HomeScreen() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [fetchHomePageData.queryKey],
    queryFn: fetchHomePageData,
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  return (
    <ScrollView
      className="flex-1 bg-neutral-50"
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => refetch()} />}
    >
      <View className="p-4">
        <Text className="text-2xl font-bold text-neutral-900">골 때리는 그녀들</Text>
        {data.currentSeason && (
          <Text className="mt-1 text-sm text-neutral-500">{data.currentSeason.season_name}</Text>
        )}
      </View>

      <View className="gap-3 px-4 pb-8">
        <MatchesWidget recentMatches={data.recentMatches} upcomingMatches={data.upcomingMatches} />
        <StandingsWidget groups={data.standings} />
        <PlayerStatsWidget
          topScorers={data.topScorers}
          topAssists={data.topAssists}
          topRatings={data.topRatings}
        />
      </View>
    </ScrollView>
  );
}
