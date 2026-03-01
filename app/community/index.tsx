import { Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function CommunityScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '커뮤니티', headerShown: true }} />
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg text-neutral-500">커뮤니티</Text>
      </View>
    </>
  );
}
