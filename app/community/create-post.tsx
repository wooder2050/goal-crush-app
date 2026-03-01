import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { createPost } from '@/api/community';
import { POST_CATEGORIES } from '@/types/community';

export default function CreatePostScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');

  const mutation = useMutation({
    mutationFn: () => createPost({ title, content, category }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
      router.back();
    },
    onError: () => Alert.alert('오류', '게시글 작성에 실패했습니다.'),
  });

  const handleSubmit = useCallback(() => {
    if (!title.trim()) {
      Alert.alert('알림', '제목을 입력하세요.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('알림', '내용을 입력하세요.');
      return;
    }
    mutation.mutate();
  }, [title, content, mutation]);

  return (
    <>
      <Stack.Screen
        options={{
          title: '글쓰기',
          headerShown: true,
          headerRight: () => (
            <Pressable className="mr-4" onPress={handleSubmit} disabled={mutation.isPending}>
              <Text
                className={`text-sm font-semibold ${mutation.isPending ? 'text-neutral-400' : 'text-primary'}`}
              >
                {mutation.isPending ? '등록 중...' : '등록'}
              </Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView className="flex-1 bg-white px-4 py-4">
        <View className="mb-4">
          <Text className="mb-2 text-sm font-semibold text-neutral-700">카테고리</Text>
          <View className="flex-row flex-wrap gap-1">
            {POST_CATEGORIES.map((c) => (
              <Pressable
                key={c.value}
                className={`rounded-full px-3 py-1.5 ${category === c.value ? 'bg-primary' : 'bg-neutral-100'}`}
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

        <TextInput
          className="mb-4 rounded-lg border border-neutral-200 px-4 py-3 text-base font-semibold"
          placeholder="제목을 입력하세요"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        <TextInput
          className="min-h-[200px] rounded-lg border border-neutral-200 px-4 py-3 text-sm leading-6"
          placeholder="내용을 입력하세요"
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />
      </ScrollView>
    </>
  );
}
