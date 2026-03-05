import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { Star } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { getPlayerRatings } from '@/api/player-ratings';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SeasonSelect } from '@/components/SeasonSelect';
import { Badge } from '@/components/ui/Badge';
import type { PlayerAbilityRating } from '@/features/player-ratings/types';

function RatingCard({ rating }: { rating: PlayerAbilityRating }) {
  const router = useRouter();
  return (
    <Pressable
      className="mx-5 mb-3 rounded-2xl border border-neutral-100 bg-white p-4 active:bg-neutral-50/80"
      onPress={() => {
        if (rating.player?.player_id) {
          router.push(`/players/${rating.player.player_id}`);
        }
      }}
    >
      <View className="flex-row items-center">
        {rating.player?.profile_image_url ? (
          <Image
            source={{ uri: rating.player.profile_image_url }}
            style={{ width: 48, height: 48, borderRadius: 24 }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View className="h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
            <Text className="text-lg font-bold text-neutral-300">
              {rating.player?.name?.charAt(0)}
            </Text>
          </View>
        )}
        <View className="ml-3.5 flex-1">
          <Text className="text-base font-bold tracking-tight text-neutral-900">
            {rating.player?.name}
          </Text>
          <Text className="mt-0.5 text-xs text-neutral-400">
            {rating.season?.season_name} · {rating.user?.korean_nickname}
          </Text>
        </View>
        {rating.overall_rating != null && (
          <View className="items-center">
            <Text className="text-2xl font-bold tabular-nums text-primary">
              {rating.overall_rating}
            </Text>
            <Text className="text-[10px] text-neutral-400">종합</Text>
          </View>
        )}
      </View>

      {rating.comment && (
        <Text className="mt-3 text-sm leading-5 text-neutral-600" numberOfLines={2}>
          {rating.comment}
        </Text>
      )}

      <View className="mt-3 flex-row gap-1.5">
        <Badge variant="outline">{rating.total_reviews}리뷰</Badge>
        <Badge variant="outline">{rating.helpful_count}도움</Badge>
      </View>
    </Pressable>
  );
}

export default function RatingsScreen() {
  const [seasonId, setSeasonId] = useState<number | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['playerRatings', seasonId],
    queryFn: () =>
      getPlayerRatings({
        season_id: seasonId ?? undefined,
        limit: 30,
      }),
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: '선수 평점',
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
        }}
      />
      <View className="flex-1 bg-neutral-50">
        <SeasonSelect selectedSeasonId={seasonId} onSelect={setSeasonId} />
        {isLoading ? (
          <LoadingSpinner />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <FlatList
            data={data?.ratings ?? []}
            keyExtractor={(item) => String(item.rating_id)}
            renderItem={({ item }) => <RatingCard rating={item} />}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyState icon={Star} message="아직 등록된 평점이 없습니다." />}
          />
        )}
      </View>
    </>
  );
}
