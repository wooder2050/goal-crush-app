import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { fetchHomePageData } from '@/api/home';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { CareerStatsWidget } from '@/features/home/components/CareerStatsWidget';
import { MatchesWidget } from '@/features/home/components/MatchesWidget';
import { PlayerStatsWidget } from '@/features/home/components/PlayerStatsWidget';
import { PowerRankingWidget } from '@/features/home/components/PowerRankingWidget';
import { StandingsWidget } from '@/features/home/components/StandingsWidget';
import { sanitizeLabel } from '@/lib/utils';

export default function HomeScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [fetchHomePageData.queryKey],
    queryFn: fetchHomePageData,
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  const seasonId = data.currentSeason?.season_id;

  return (
    <ScrollView
      className="flex-1 bg-neutral-50"
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={() => refetch()} tintColor="#ff4800" />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Hero header */}
      <View className="bg-white pb-4">
        <View
          className="absolute left-0 right-0 top-0 bg-primary"
          style={{ height: 80, opacity: 0.03 }}
        />
        <View className="px-5 pt-4">
          <Text className="text-2xl font-bold tracking-tight text-neutral-900">
            GTN 데이터센터
          </Text>

          {data.currentSeason && (
            <Pressable
              className="mt-2 self-start"
              onPress={() => {
                if (seasonId) router.push(`/seasons/${seasonId}`);
              }}
            >
              <View
                className="flex-row items-center rounded-full bg-primary/10 px-3 py-1"
                style={{ gap: 4 }}
              >
                <View className="h-1.5 w-1.5 rounded-full bg-primary" />
                <Text className="text-[12px] font-bold text-primary">
                  {sanitizeLabel(data.currentSeason.season_name)}
                </Text>
              </View>
            </Pressable>
          )}
        </View>
      </View>

      {/* Content sections */}
      <View className="gap-4 px-5 pb-10 pt-4">
        <MatchesWidget
          recentMatches={data.recentMatches}
          upcomingMatches={data.upcomingMatches}
          seasonId={seasonId}
        />
        <StandingsWidget groups={data.standings} seasonId={seasonId} />
        <PowerRankingWidget />
        <PlayerStatsWidget
          topScorers={data.topScorers}
          topAssists={data.topAssists}
          topRatings={data.topRatings}
          topXtRatings={data.topXtRatings}
          seasonId={seasonId}
        />
        <CareerStatsWidget
          careerTopScorers={data.careerTopScorers}
          careerTopAssists={data.careerTopAssists}
          careerGoalsPerMatch={data.careerGoalsPerMatch}
          careerAssistsPerMatch={data.careerAssistsPerMatch}
          careerAttackPoints={data.careerAttackPoints}
          careerAttackPointsPerMatch={data.careerAttackPointsPerMatch}
        />
      </View>
    </ScrollView>
  );
}
