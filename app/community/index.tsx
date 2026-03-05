import { useInfiniteQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Stack, useRouter } from 'expo-router';
import { Heart, MessageCircle, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { getCommunityPosts } from '@/api/community';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PressableCard } from '@/components/ui/Card';
import type { CommunityPost } from '@/types/community';
import { POST_CATEGORIES } from '@/types/community';

const SORT_OPTIONS = [
  { key: 'recent' as const, label: '최신순' },
  { key: 'popular' as const, label: '인기순' },
];

function PostCard({ post }: { post: CommunityPost }) {
  const router = useRouter();
  return (
    <PressableCard className="mx-5 mb-2.5" onPress={() => router.push(`/community/${post.id}`)}>
      <Text className="text-[15px] font-semibold leading-5 text-neutral-900" numberOfLines={2}>
        {post.title}
      </Text>
      {post.content && (
        <Text className="mt-1.5 text-sm leading-5 text-neutral-400" numberOfLines={2}>
          {post.content}
        </Text>
      )}
      <View className="mt-3 flex-row items-center justify-between">
        <Text className="text-xs text-neutral-400">
          {post.user_nickname} · {format(new Date(post.created_at), 'MM/dd HH:mm')}
        </Text>
        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center gap-1">
            <Heart size={12} color="#d4d4d4" />
            <Text className="text-xs tabular-nums text-neutral-400">{post.likes_count}</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <MessageCircle size={12} color="#d4d4d4" />
            <Text className="text-xs tabular-nums text-neutral-400">{post.comments_count}</Text>
          </View>
        </View>
      </View>
    </PressableCard>
  );
}

function FilterPill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={`rounded-full px-4 py-1.5 ${selected ? 'bg-primary' : 'bg-neutral-100'}`}
      onPress={onPress}
    >
      <Text className={`text-xs font-semibold ${selected ? 'text-white' : 'text-neutral-500'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function CommunityScreen() {
  const router = useRouter();
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['communityPosts', category, sortBy],
      queryFn: ({ pageParam }) =>
        getCommunityPosts({
          page: pageParam as number,
          limit: 15,
          category: category || undefined,
          sortBy,
        }),
      initialPageParam: 1,
      getNextPageParam: (lastPage) =>
        lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined,
    });

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];

  return (
    <>
      <Stack.Screen
        options={{
          title: '커뮤니티',
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
          headerRight: () => (
            <Pressable
              className="mr-1 flex-row items-center rounded-full bg-primary px-3 py-1.5"
              onPress={() => router.push('/community/create-post')}
            >
              <Plus size={14} color="#fff" strokeWidth={3} />
              <Text className="ml-1 text-xs font-bold text-white">글쓰기</Text>
            </Pressable>
          ),
        }}
      />
      <View className="flex-1 bg-neutral-50">
        <View className="border-b border-neutral-100 bg-white px-5 pb-3 pt-2">
          <View className="mb-2.5 flex-row gap-2">
            {SORT_OPTIONS.map((opt) => (
              <FilterPill
                key={opt.key}
                label={opt.label}
                selected={sortBy === opt.key}
                onPress={() => setSortBy(opt.key)}
              />
            ))}
          </View>
          <View className="flex-row gap-2">
            <FilterPill label="전체" selected={category === ''} onPress={() => setCategory('')} />
            {POST_CATEGORIES.map((c) => (
              <FilterPill
                key={c.value}
                label={c.label}
                selected={category === c.value}
                onPress={() => setCategory(c.value)}
              />
            ))}
          </View>
        </View>

        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostCard post={item} />}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={isFetchingNextPage ? <LoadingSpinner size="small" /> : null}
          ListEmptyComponent={
            <EmptyState title="게시글이 없습니다" description="첫 번째 글을 작성해보세요!" />
          }
        />
      </View>
    </>
  );
}
