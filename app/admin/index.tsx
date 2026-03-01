import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

import { useAuth } from '@/components/AuthProvider';

export default function AdminScreen() {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAdmin) {
    return <Redirect href="/" />;
  }

  return (
    <>
      <Stack.Screen options={{ title: '관리자', headerShown: true }} />
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg text-neutral-500">관리자</Text>
      </View>
    </>
  );
}
