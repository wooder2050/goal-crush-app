import { useInfiniteQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { FlatList, Text, View } from 'react-native';

import { CoachesPageItem, getCoachesPagePrisma } from '@/api/coaches';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TeamLogo } from '@/components/TeamLogo';
import { Badge } from '@/components/ui/Badge';
import { PressableCard } from '@/components/ui/Card';

function CoachCard({ coach }: { coach: CoachesPageItem }) {
  const router = useRouter();
  const totalMatches = coach.total_matches || 0;

  return (
    <PressableCard className="mx-4 mb-3" onPress={() => router.push(`/coaches/${coach.coach_id}`)}>
      <View className="flex-row">
        {coach.profile_image_url ? (
          <Image
            source={{ uri: coach.profile_image_url }}
            style={{ width: 56, height: 56 }}
            className="rounded-full"
            contentFit="cover"
          />
        ) : (
          <View className="h-14 w-14 items-center justify-center rounded-full bg-neutral-200">
            <Text className="text-lg font-bold text-neutral-400">{coach.name?.charAt(0)}</Text>
          </View>
        )}
        <View className="ml-3 flex-1 justify-center">
          <Text className="text-base font-bold text-neutral-900">{coach.name}</Text>
          {coach.nationality && (
            <Text className="text-xs text-neutral-500">{coach.nationality}</Text>
          )}
          {coach.current_team_verified ? (
            <View className="mt-1 flex-row items-center">
              <TeamLogo
                uri={coach.current_team_verified.logo}
                size={16}
                teamName={coach.current_team_verified.team_name}
              />
              <Text className="ml-1 text-xs text-neutral-600">
                {coach.current_team_verified.team_name}
              </Text>
            </View>
          ) : (
            <Text className="mt-1 text-xs text-neutral-400">현재 맡은 팀 없음</Text>
          )}
        </View>
        <View className="items-end justify-center">
          <Text className="text-xs text-neutral-500">{totalMatches}경기</Text>
        </View>
      </View>
      {coach.team_coach_history && coach.team_coach_history.length > 0 && (
        <View className="mt-2 flex-row flex-wrap gap-1">
          {coach.team_coach_history.map((h) => (
            <Badge key={h.id} variant="warning">
              {h.season.season_name}
            </Badge>
          ))}
        </View>
      )}
    </PressableCard>
  );
}

export default function CoachesScreen() {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['coachesPage'],
      queryFn: ({ pageParam }) => getCoachesPagePrisma(pageParam as number, 10),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextPage,
    });

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const coaches = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <Stack.Screen options={{ title: '코치', headerShown: true }} />
      <FlatList
        className="flex-1 bg-neutral-50"
        data={coaches}
        keyExtractor={(item) => String(item.coach_id)}
        renderItem={({ item }) => <CoachCard coach={item} />}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isFetchingNextPage ? <LoadingSpinner size="small" /> : null}
      />
    </>
  );
}
