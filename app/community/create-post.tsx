import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

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
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
          headerRight: () => (
            <Pressable
              className="mr-1 flex-row items-center gap-1.5"
              onPress={handleSubmit}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <ActivityIndicator size="small" color="#ff4800" />
              ) : (
                <Text className="text-sm font-bold text-primary">등록</Text>
              )}
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          className="flex-1 bg-white px-5 pt-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-5">
            <Text className="mb-2.5 text-sm font-bold text-neutral-800">카테고리</Text>
            <View className="flex-row flex-wrap gap-2">
              {POST_CATEGORIES.map((c) => (
                <Pressable
                  key={c.value}
                  className={`rounded-full px-4 py-1.5 ${category === c.value ? 'bg-primary' : 'bg-neutral-50 border border-neutral-200'}`}
                  onPress={() => setCategory(c.value)}
                >
                  <Text
                    className={`text-xs font-semibold ${category === c.value ? 'text-white' : 'text-neutral-600'}`}
                  >
                    {c.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <TextInput
            className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-base font-semibold text-neutral-900"
            placeholder="제목을 입력하세요"
            placeholderTextColor="#b5b5b5"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />

          <TextInput
            className="min-h-[240px] rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-sm leading-6 text-neutral-800"
            placeholder="내용을 입력하세요"
            placeholderTextColor="#b5b5b5"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
