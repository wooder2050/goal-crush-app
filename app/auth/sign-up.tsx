import { useRouter } from 'expo-router';
import { useState } from 'react';
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

import { useAuth } from '@/components/AuthProvider';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUpWithEmail } = useAuth();
  const router = useRouter();

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('오류', '모든 필드를 입력해주세요.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('오류', '비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);
    try {
      await signUpWithEmail(email, password);
      Alert.alert('회원가입 완료', '이메일을 확인해주세요.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('회원가입 실패', error instanceof Error ? error.message : '다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-10 items-center">
          <Text className="text-xl font-bold text-neutral-900">계정 만들기</Text>
          <Text className="mt-1 text-sm text-neutral-400">간단한 정보만 입력하세요</Text>
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

        <View className="mb-4">
          <Text className="mb-2 text-sm font-medium text-neutral-600">비밀번호</Text>
          <TextInput
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-base text-neutral-900"
            placeholder="6자 이상 입력해주세요"
            placeholderTextColor="#b5b5b5"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <View className="mb-8">
          <Text className="mb-2 text-sm font-medium text-neutral-600">비밀번호 확인</Text>
          <TextInput
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-base text-neutral-900"
            placeholder="비밀번호를 다시 입력해주세요"
            placeholderTextColor="#b5b5b5"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        <Pressable
          className={`items-center rounded-xl py-4 ${isLoading ? 'bg-neutral-300' : 'bg-primary active:bg-primary-dark'}`}
          onPress={handleSignUp}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-bold text-white">회원가입</Text>
          )}
        </Pressable>

        <Pressable className="mt-5 items-center py-2" onPress={() => router.back()}>
          <Text className="text-sm text-neutral-400">
            이미 계정이 있으신가요? <Text className="font-semibold text-primary">로그인</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
