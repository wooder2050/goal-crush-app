import { Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function SupportsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '응원', headerShown: true }} />
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg text-neutral-500">응원</Text>
      </View>
    </>
  );
}
