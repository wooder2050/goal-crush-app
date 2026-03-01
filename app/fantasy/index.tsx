import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Stack, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { FantasySeasonItem, getActiveFantasySeasons, getUserFantasyTeams } from '@/api/fantasy';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { Card, PressableCard } from '@/components/ui/Card';
import { H2, H3 } from '@/components/ui/Typography';

function SeasonCard({ season }: { season: FantasySeasonItem }) {
  const router = useRouter();
  const isLocked = new Date(season.lock_date) < new Date();

  return (
    <PressableCard
      className="mb-3"
      onPress={() => router.push(`/fantasy/${season.fantasy_season_id}/rankings`)}
    >
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-base font-bold text-neutral-900">
            {season.season_name ?? `${season.year}년 ${season.month}월`}
          </Text>
          <Text className="mt-0.5 text-xs text-neutral-500">
            {format(new Date(season.start_date), 'MM/dd')} ~{' '}
            {format(new Date(season.end_date), 'MM/dd')}
          </Text>
        </View>
        <View className="flex-row gap-1">
          {season.is_active && <Badge variant="success">활성</Badge>}
          {isLocked && <Badge variant="default">마감</Badge>}
        </View>
      </View>
      <View className="mt-2 flex-row gap-2">
        <Pressable
          className="rounded-lg bg-primary px-3 py-1.5"
          onPress={() => {
            if (!isLocked) {
              router.push(`/fantasy/${season.fantasy_season_id}/create`);
            }
          }}
          disabled={isLocked}
        >
          <Text className="text-xs font-semibold text-white">
            {isLocked ? '마감됨' : '팀 만들기'}
          </Text>
        </Pressable>
        <Pressable
          className="rounded-lg bg-neutral-100 px-3 py-1.5"
          onPress={() => router.push(`/fantasy/${season.fantasy_season_id}/rankings`)}
        >
          <Text className="text-xs font-semibold text-neutral-600">랭킹 보기</Text>
        </Pressable>
      </View>
    </PressableCard>
  );
}

export default function FantasyScreen() {
  const router = useRouter();

  const {
    data: seasons,
    isLoading: seasonsLoading,
    isError: seasonsError,
    refetch: refetchSeasons,
  } = useQuery({
    queryKey: ['fantasySeasons'],
    queryFn: getActiveFantasySeasons,
  });

  const { data: myTeams } = useQuery({
    queryKey: ['myFantasyTeams'],
    queryFn: getUserFantasyTeams,
  });

  if (seasonsLoading) return <LoadingSpinner />;
  if (seasonsError) return <ErrorState onRetry={() => refetchSeasons()} />;

  return (
    <>
      <Stack.Screen options={{ title: '판타지 리그', headerShown: true }} />
      <ScrollView className="flex-1 bg-neutral-50 px-4 py-4">
        {myTeams && myTeams.length > 0 && (
          <Card className="mb-4">
            <H3 className="mb-2">내 팀</H3>
            {myTeams.map((team) => (
              <Pressable
                key={team.fantasy_team_id}
                className="flex-row items-center justify-between border-b border-neutral-100 py-2"
                onPress={() => router.push(`/fantasy/team/${team.fantasy_team_id}`)}
              >
                <View>
                  <Text className="text-sm font-semibold text-neutral-900">{team.team_name}</Text>
                  <Text className="text-xs text-neutral-500">
                    {team.players.length}명 · {team.season_name}
                  </Text>
                </View>
                <Text className="text-lg font-bold text-primary">{team.total_points}pt</Text>
              </Pressable>
            ))}
          </Card>
        )}

        <H2 className="mb-3">판타지 시즌</H2>
        {seasons && seasons.length > 0 ? (
          seasons.map((s) => <SeasonCard key={s.fantasy_season_id} season={s} />)
        ) : (
          <View className="items-center py-16">
            <Text className="text-sm text-neutral-500">진행 중인 판타지 시즌이 없습니다.</Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}
