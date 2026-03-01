import { useInfiniteQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { getCommunityPosts } from '@/api/community';
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
    <PressableCard className="mx-4 mb-2" onPress={() => router.push(`/community/${post.id}`)}>
      <Text className="text-base font-semibold text-neutral-900" numberOfLines={2}>
        {post.title}
      </Text>
      {post.content && (
        <Text className="mt-1 text-sm text-neutral-500" numberOfLines={2}>
          {post.content}
        </Text>
      )}
      <View className="mt-2 flex-row items-center justify-between">
        <Text className="text-xs text-neutral-400">
          {post.user_nickname} · {format(new Date(post.created_at), 'MM/dd HH:mm')}
        </Text>
        <View className="flex-row gap-2">
          <Text className="text-xs text-neutral-400">♥ {post.likes_count}</Text>
          <Text className="text-xs text-neutral-400">💬 {post.comments_count}</Text>
        </View>
      </View>
    </PressableCard>
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
          headerRight: () => (
            <Pressable className="mr-4" onPress={() => router.push('/community/create-post')}>
              <Text className="text-sm font-semibold text-primary">글쓰기</Text>
            </Pressable>
          ),
        }}
      />
      <View className="flex-1 bg-neutral-50">
        <View className="border-b border-neutral-200 bg-white px-4 py-2">
          <View className="mb-2 flex-row gap-1">
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                className={`rounded-full px-3 py-1 ${sortBy === opt.key ? 'bg-primary' : 'bg-neutral-100'}`}
                onPress={() => setSortBy(opt.key)}
              >
                <Text
                  className={`text-xs font-medium ${sortBy === opt.key ? 'text-white' : 'text-neutral-600'}`}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View className="flex-row gap-1">
            <Pressable
              className={`rounded-full px-3 py-1 ${category === '' ? 'bg-primary' : 'bg-neutral-100'}`}
              onPress={() => setCategory('')}
            >
              <Text
                className={`text-xs font-medium ${category === '' ? 'text-white' : 'text-neutral-600'}`}
              >
                전체
              </Text>
            </Pressable>
            {POST_CATEGORIES.map((c) => (
              <Pressable
                key={c.value}
                className={`rounded-full px-3 py-1 ${category === c.value ? 'bg-primary' : 'bg-neutral-100'}`}
                onPress={() => setCategory(c.value)}
              >
                <Text
                  className={`text-xs font-medium ${category === c.value ? 'text-white' : 'text-neutral-600'}`}
                >
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostCard post={item} />}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isFetchingNextPage ? <LoadingSpinner size="small" /> : null}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Text className="text-sm text-neutral-500">게시글이 없습니다.</Text>
            </View>
          }
        />
      </View>
    </>
  );
}
