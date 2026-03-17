import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/components/AuthProvider';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithEmail } = useAuth();
  const router = useRouter();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmail(email, password);
      router.back();
    } catch (error) {
      Alert.alert('로그인 실패', error instanceof Error ? error.message : '다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center px-6">
        <View className="mb-10 items-center">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Text className="text-2xl font-bold text-white">G</Text>
          </View>
          <Text className="text-xl font-bold text-neutral-900">골크러쉬</Text>
          <Text className="mt-1 text-sm text-neutral-400">데이터센터에 로그인</Text>
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-sm font-medium text-neutral-600">이메일</Text>
          <TextInput
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-base text-neutral-900"
            placeholder="이메일을 입력해주세요"
            placeholderTextColor="#b5b5b5"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View className="mb-8">
          <Text className="mb-2 text-sm font-medium text-neutral-600">비밀번호</Text>
          <TextInput
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-base text-neutral-900"
            placeholder="비밀번호를 입력해주세요"
            placeholderTextColor="#b5b5b5"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <Pressable
          className={`items-center rounded-xl py-4 ${isLoading ? 'bg-neutral-300' : 'bg-primary active:bg-primary-dark'}`}
          onPress={handleSignIn}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-bold text-white">로그인</Text>
          )}
        </Pressable>

        <Pressable className="mt-5 items-center py-2" onPress={() => router.push('/auth/sign-up')}>
          <Text className="text-sm text-neutral-400">
            계정이 없으신가요? <Text className="font-semibold text-primary">회원가입</Text>
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
