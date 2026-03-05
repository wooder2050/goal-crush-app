import { useInfiniteQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { FlatList, Pressable, Text, View } from 'react-native';

import { CoachesPageItem, getCoachesPagePrisma } from '@/api/coaches';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TeamLogo } from '@/components/TeamLogo';
import { Card } from '@/components/ui/Card';

const NUM = { fontVariant: ['tabular-nums' as const] };

function CoachCard({
  coach,
  router,
}: {
  coach: CoachesPageItem;
  router: ReturnType<typeof useRouter>;
}) {
  const totalMatches = coach.total_matches || 0;
  const hasTeam = !!coach.current_team_verified;

  return (
    <Pressable
      className="mx-4 mb-3 active:scale-[0.99]"
      onPress={() => router.push(`/coaches/${coach.coach_id}`)}
    >
      <Card className="overflow-hidden p-0">
        <View className="flex-row items-center p-3.5">
          {/* Photo — taller rectangle to show upper body properly */}
          {coach.profile_image_url ? (
            <Image
              source={{ uri: coach.profile_image_url }}
              style={{
                width: 56,
                height: 68,
                borderRadius: 12,
              }}
              contentFit="cover"
              contentPosition="top"
              transition={200}
            />
          ) : (
            <View
              className="items-center justify-center rounded-xl bg-neutral-100"
              style={{ width: 56, height: 68 }}
            >
              <Text className="text-xl font-bold text-neutral-300">{coach.name?.charAt(0)}</Text>
            </View>
          )}

          {/* Info */}
          <View className="ml-3.5 flex-1">
            <Text className="text-[15px] font-bold text-neutral-900">{coach.name}</Text>

            {/* Current team */}
            {hasTeam ? (
              <View className="mt-1.5 flex-row items-center" style={{ gap: 5 }}>
                <TeamLogo
                  uri={coach.current_team_verified!.logo}
                  size={18}
                  teamName={coach.current_team_verified!.team_name}
                />
                <Text className="text-[12px] font-medium text-neutral-600">
                  {coach.current_team_verified!.team_name}
                </Text>
              </View>
            ) : (
              <Text className="mt-1.5 text-[12px] text-neutral-400">현재 맡은 팀 없음</Text>
            )}

            {/* Stats row */}
            {totalMatches > 0 && (
              <View className="mt-2 flex-row" style={{ gap: 4 }}>
                <View className="rounded-md bg-neutral-50 px-2 py-0.5">
                  <Text className="text-[10px] font-semibold text-neutral-500" style={NUM}>
                    {totalMatches}경기
                  </Text>
                </View>
              </View>
            )}
          </View>

          <ChevronRight size={16} color="#d4d4d4" />
        </View>
      </Card>
    </Pressable>
  );
}

export default function CoachesScreen() {
  const router = useRouter();
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
      <Stack.Screen
        options={{
          title: '감독',
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
        }}
      />
      <FlatList
        className="flex-1 bg-neutral-50"
        data={coaches}
        keyExtractor={(item) => String(item.coach_id)}
        renderItem={({ item }) => <CoachCard coach={item} router={router} />}
        contentContainerStyle={{ paddingTop: 14, paddingBottom: 32 }}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={isFetchingNextPage ? <LoadingSpinner size="small" /> : null}
      />
    </>
  );
}
