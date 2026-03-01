import { Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function AdminScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '관리자', headerShown: true }} />
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg text-neutral-500">관리자</Text>
      </View>
    </>
  );
}
