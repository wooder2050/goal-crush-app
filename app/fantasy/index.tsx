import { Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function FantasyScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '판타지', headerShown: true }} />
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg text-neutral-500">판타지</Text>
      </View>
    </>
  );
}
