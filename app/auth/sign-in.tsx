import { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
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
      Alert.alert(
        '로그인 실패',
        error instanceof Error ? error.message : '다시 시도해주세요.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-6 pt-8">
      <Text className="mb-8 text-center text-2xl font-bold text-neutral-900">
        골 때리는 그녀들{'\n'}데이터 센터
      </Text>

      <View className="mb-4">
        <Text className="mb-1 text-sm font-medium text-neutral-700">
          이메일
        </Text>
        <TextInput
          className="rounded-lg border border-neutral-200 px-4 py-3 text-base text-neutral-900"
          placeholder="이메일을 입력해주세요"
          placeholderTextColor="#a3a3a3"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View className="mb-6">
        <Text className="mb-1 text-sm font-medium text-neutral-700">
          비밀번호
        </Text>
        <TextInput
          className="rounded-lg border border-neutral-200 px-4 py-3 text-base text-neutral-900"
          placeholder="비밀번호를 입력해주세요"
          placeholderTextColor="#a3a3a3"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <Pressable
        className={`items-center rounded-lg py-4 ${isLoading ? 'bg-neutral-300' : 'bg-primary active:bg-primary-dark'}`}
        onPress={handleSignIn}
        disabled={isLoading}
      >
        <Text className="text-base font-semibold text-white">
          {isLoading ? '로그인 중...' : '로그인'}
        </Text>
      </Pressable>

      <Pressable
        className="mt-4 items-center py-2"
        onPress={() => router.push('/auth/sign-up')}
      >
        <Text className="text-sm text-neutral-500">
          계정이 없으신가요?{' '}
          <Text className="font-semibold text-primary">회원가입</Text>
        </Text>
      </Pressable>
    </View>
  );
}
