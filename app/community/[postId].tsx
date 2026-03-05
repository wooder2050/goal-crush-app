import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Eye, Heart, MessageCircle, Send } from 'lucide-react-native';
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
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

function CommentItem({ comment }: { comment: PostComment }) {
  return (
    <View className="py-3.5">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-bold text-neutral-800">{comment.user_nickname}</Text>
        <Text className="text-[11px] text-neutral-400">
          {format(new Date(comment.created_at), 'MM/dd HH:mm')}
        </Text>
      </View>
      <Text className="mt-1.5 text-sm leading-5 text-neutral-600">{comment.content}</Text>
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
      <Stack.Screen
        options={{
          title: '게시글',
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
        }}
      />
      <KeyboardAvoidingView
        className="flex-1 bg-neutral-50"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={() => refetch()} tintColor="#ff4800" />
          }
          showsVerticalScrollIndicator={false}
        >
          <Card className="mx-5 mt-4 p-5">
            <Text className="text-lg font-bold leading-6 text-neutral-900">{post.title}</Text>
            <View className="mt-3 flex-row items-center justify-between">
              <Text className="text-xs text-neutral-400">
                {post.user_nickname} · {format(new Date(post.created_at), 'yyyy.MM.dd HH:mm')}
              </Text>
              {post.category && <Badge variant="primary">{post.category}</Badge>}
            </View>
            {post.content && (
              <Text className="mt-5 text-sm leading-6 text-neutral-600">{post.content}</Text>
            )}
            <View className="mt-5 flex-row items-center gap-5 border-t border-neutral-100 pt-3.5">
              <Pressable
                className="flex-row items-center gap-1.5"
                onPress={() => likeMutation.mutate()}
              >
                <Heart
                  size={16}
                  color={post.is_liked ? '#ff4800' : '#a3a3a3'}
                  fill={post.is_liked ? '#ff4800' : 'transparent'}
                />
                <Text
                  className={`text-sm tabular-nums ${post.is_liked ? 'font-semibold text-primary' : 'text-neutral-500'}`}
                >
                  {post.likes_count}
                </Text>
              </Pressable>
              <View className="flex-row items-center gap-1.5">
                <MessageCircle size={16} color="#a3a3a3" />
                <Text className="text-sm tabular-nums text-neutral-500">{post.comments_count}</Text>
              </View>
              {post.views_count != null && (
                <View className="flex-row items-center gap-1.5">
                  <Eye size={16} color="#a3a3a3" />
                  <Text className="text-sm tabular-nums text-neutral-500">{post.views_count}</Text>
                </View>
              )}
            </View>
          </Card>

          <View className="px-5 pb-4 pt-5">
            <Text className="mb-3 text-sm font-bold text-neutral-800">
              댓글 {post.comments?.length ?? 0}
            </Text>
            {post.comments && post.comments.length > 0 ? (
              <View className="rounded-2xl border border-neutral-100 bg-white px-4">
                {post.comments.map((c, i) => (
                  <View
                    key={c.id}
                    className={i < post.comments!.length - 1 ? 'border-b border-neutral-100' : ''}
                  >
                    <CommentItem comment={c} />
                  </View>
                ))}
              </View>
            ) : (
              <Text className="py-8 text-center text-sm text-neutral-400">
                아직 댓글이 없습니다.
              </Text>
            )}
          </View>
        </ScrollView>

        <View className="flex-row items-center border-t border-neutral-100 bg-white px-5 py-2.5">
          <TextInput
            className="mr-2.5 h-10 flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 text-sm"
            placeholder="댓글을 입력하세요"
            placeholderTextColor="#b5b5b5"
            value={commentText}
            onChangeText={setCommentText}
            returnKeyType="send"
            onSubmitEditing={handleSubmitComment}
          />
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-xl bg-primary active:bg-primary-dark"
            onPress={handleSubmitComment}
            disabled={commentMutation.isPending}
          >
            <Send size={16} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
