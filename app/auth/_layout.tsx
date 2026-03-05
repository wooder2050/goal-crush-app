import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontFamily: 'Inter_600SemiBold',
          fontSize: 17,
          color: '#171717',
        },
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen name="sign-in" options={{ title: '로그인' }} />
      <Stack.Screen name="sign-up" options={{ title: '회원가입' }} />
    </Stack>
  );
}
