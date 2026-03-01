import { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
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
      Alert.alert(
        '회원가입 실패',
        error instanceof Error ? error.message : '다시 시도해주세요.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-6 pt-8">
      <Text className="mb-8 text-center text-2xl font-bold text-neutral-900">
        회원가입
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

      <View className="mb-4">
        <Text className="mb-1 text-sm font-medium text-neutral-700">
          비밀번호
        </Text>
        <TextInput
          className="rounded-lg border border-neutral-200 px-4 py-3 text-base text-neutral-900"
          placeholder="6자 이상 입력해주세요"
          placeholderTextColor="#a3a3a3"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <View className="mb-6">
        <Text className="mb-1 text-sm font-medium text-neutral-700">
          비밀번호 확인
        </Text>
        <TextInput
          className="rounded-lg border border-neutral-200 px-4 py-3 text-base text-neutral-900"
          placeholder="비밀번호를 다시 입력해주세요"
          placeholderTextColor="#a3a3a3"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      </View>

      <Pressable
        className={`items-center rounded-lg py-4 ${isLoading ? 'bg-neutral-300' : 'bg-primary active:bg-primary-dark'}`}
        onPress={handleSignUp}
        disabled={isLoading}
      >
        <Text className="text-base font-semibold text-white">
          {isLoading ? '가입 중...' : '회원가입'}
        </Text>
      </Pressable>

      <Pressable
        className="mt-4 items-center py-2"
        onPress={() => router.back()}
      >
        <Text className="text-sm text-neutral-500">
          이미 계정이 있으신가요?{' '}
          <Text className="font-semibold text-primary">로그인</Text>
        </Text>
      </Pressable>
    </View>
  );
}
