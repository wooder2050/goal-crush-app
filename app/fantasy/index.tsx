import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Stack, useRouter } from 'expo-router';
import { ChevronRight, Sparkles, Trophy } from 'lucide-react-native';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { FantasySeasonItem, getActiveFantasySeasons, getUserFantasyTeams } from '@/api/fantasy';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { Card, PressableCard } from '@/components/ui/Card';
import { sanitizeLabel } from '@/lib/utils';

function SeasonCard({ season }: { season: FantasySeasonItem }) {
  const router = useRouter();
  const isLocked = new Date(season.lock_date) < new Date();

  return (
    <PressableCard
      className="mb-3"
      onPress={() => router.push(`/fantasy/${season.fantasy_season_id}/rankings`)}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-base font-bold tracking-tight text-neutral-900">
            {sanitizeLabel(season.season_name) || `${season.year}년 ${season.month}월`}
          </Text>
          <Text className="mt-0.5 text-xs text-neutral-400">
            {format(new Date(season.start_date), 'MM/dd')} ~{' '}
            {format(new Date(season.end_date), 'MM/dd')}
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          {season.is_active && <Badge variant="success">활성</Badge>}
          {isLocked && <Badge variant="default">마감</Badge>}
          <ChevronRight size={16} color="#d4d4d4" />
        </View>
      </View>
      <View className="mt-3 flex-row gap-2">
        <Pressable
          className={`rounded-xl px-4 py-2 ${isLocked ? 'bg-neutral-200' : 'bg-primary'}`}
          onPress={() => {
            if (!isLocked) {
              router.push(`/fantasy/${season.fantasy_season_id}/create`);
            }
          }}
          disabled={isLocked}
        >
          <Text className={`text-xs font-bold ${isLocked ? 'text-neutral-400' : 'text-white'}`}>
            {isLocked ? '마감됨' : '팀 만들기'}
          </Text>
        </Pressable>
        <Pressable
          className="rounded-xl bg-neutral-50 px-4 py-2"
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
      <Stack.Screen
        options={{
          title: '판타지 리그',
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        className="flex-1 bg-neutral-50"
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => refetchSeasons()}
            tintColor="#ff4800"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {myTeams && myTeams.length > 0 && (
          <Card className="mx-5 mt-4 p-5">
            <View className="mb-3 flex-row items-center">
              <Sparkles size={16} color="#ff4800" />
              <Text className="ml-2 text-base font-bold text-neutral-800">내 팀</Text>
            </View>
            {myTeams.map((team, i) => (
              <Pressable
                key={team.fantasy_team_id}
                className={`flex-row items-center justify-between py-3 ${i < myTeams.length - 1 ? 'border-b border-neutral-100' : ''}`}
                onPress={() => router.push(`/fantasy/team/${team.fantasy_team_id}`)}
              >
                <View>
                  <Text className="text-sm font-semibold text-neutral-900">{team.team_name}</Text>
                  <Text className="mt-0.5 text-xs text-neutral-400">
                    {team.players.length}명 · {sanitizeLabel(team.season_name)}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-lg font-bold tabular-nums text-primary">
                    {team.total_points}pt
                  </Text>
                  <ChevronRight size={14} color="#d4d4d4" />
                </View>
              </Pressable>
            ))}
          </Card>
        )}

        <View className="px-5 pt-5">
          <View className="mb-3 flex-row items-center">
            <View className="mr-2 h-4 w-1 rounded-full bg-primary" />
            <Text className="text-base font-bold text-neutral-800">판타지 시즌</Text>
          </View>
          {seasons && seasons.length > 0 ? (
            seasons.map((s) => <SeasonCard key={s.fantasy_season_id} season={s} />)
          ) : (
            <EmptyState icon={Trophy} message="진행 중인 판타지 시즌이 없습니다." />
          )}
        </View>
      </ScrollView>
    </>
  );
}
