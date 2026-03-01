import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { addComment, getPostById, likePost, PostComment } from '@/api/community';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card } from '@/components/ui/Card';

function CommentItem({ comment }: { comment: PostComment }) {
  return (
    <View className="border-b border-neutral-100 py-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-neutral-900">{comment.user_nickname}</Text>
        <Text className="text-xs text-neutral-400">
          {format(new Date(comment.created_at), 'MM/dd HH:mm')}
        </Text>
      </View>
      <Text className="mt-1 text-sm text-neutral-700">{comment.content}</Text>
    </View>
  );
}

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');

  const {
    data: post,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['communityPost', postId],
    queryFn: () => getPostById(postId!),
    enabled: !!postId,
  });

  const likeMutation = useMutation({
    mutationFn: () => likePost(postId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['communityPost', postId] }),
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => addComment(postId!, content),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['communityPost', postId] });
    },
    onError: () => Alert.alert('오류', '댓글 작성에 실패했습니다.'),
  });

  const handleSubmitComment = useCallback(() => {
    if (commentText.trim()) {
      commentMutation.mutate(commentText.trim());
    }
  }, [commentText, commentMutation]);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !post) return <ErrorState onRetry={() => refetch()} />;

  return (
    <>
      <Stack.Screen options={{ title: '게시글', headerShown: true }} />
      <KeyboardAvoidingView
        className="flex-1 bg-neutral-50"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          className="flex-1"
          refreshControl={<RefreshControl refreshing={false} onRefresh={() => refetch()} />}
        >
          <Card className="mx-4 mt-4">
            <Text className="text-lg font-bold text-neutral-900">{post.title}</Text>
            <View className="mt-2 flex-row items-center justify-between">
              <Text className="text-xs text-neutral-500">
                {post.user_nickname} · {format(new Date(post.created_at), 'yyyy.MM.dd HH:mm')}
              </Text>
              {post.category && <Text className="text-xs text-primary">{post.category}</Text>}
            </View>
            {post.content && (
              <Text className="mt-4 text-sm leading-6 text-neutral-700">{post.content}</Text>
            )}
            <View className="mt-4 flex-row items-center gap-4 border-t border-neutral-100 pt-3">
              <Pressable className="flex-row items-center" onPress={() => likeMutation.mutate()}>
                <Text className="text-sm text-neutral-500">
                  ♥ {post.likes_count} {post.is_liked ? '(좋아요 취소)' : '좋아요'}
                </Text>
              </Pressable>
              <Text className="text-sm text-neutral-400">💬 {post.comments_count}</Text>
              {post.views_count != null && (
                <Text className="text-sm text-neutral-400">👁 {post.views_count}</Text>
              )}
            </View>
          </Card>

          <View className="px-4 py-4">
            <Text className="mb-2 text-sm font-semibold text-neutral-900">
              댓글 {post.comments?.length ?? 0}
            </Text>
            {post.comments && post.comments.length > 0 ? (
              post.comments.map((c) => <CommentItem key={c.id} comment={c} />)
            ) : (
              <Text className="py-4 text-center text-sm text-neutral-400">
                아직 댓글이 없습니다.
              </Text>
            )}
          </View>
        </ScrollView>

        <View className="flex-row items-center border-t border-neutral-200 bg-white px-4 py-2">
          <TextInput
            className="mr-2 h-9 flex-1 rounded-lg border border-neutral-200 px-3 text-sm"
            placeholder="댓글을 입력하세요"
            value={commentText}
            onChangeText={setCommentText}
            returnKeyType="send"
            onSubmitEditing={handleSubmitComment}
          />
          <Pressable
            className="rounded-lg bg-primary px-4 py-2"
            onPress={handleSubmitComment}
            disabled={commentMutation.isPending}
          >
            <Text className="text-sm font-semibold text-white">등록</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
