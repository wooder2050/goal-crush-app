import { Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function RatingsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '평점', headerShown: true }} />
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg text-neutral-500">평점</Text>
      </View>
    </>
  );
}
