import { View, Text } from 'react-native';
import { Stack } from 'expo-router';

export default function TeamsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '팀', headerShown: true }} />
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg text-neutral-500">팀</Text>
      </View>
    </>
  );
}
