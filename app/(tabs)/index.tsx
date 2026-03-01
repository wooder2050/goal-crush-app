import { ScrollView, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4">
        <Text className="text-2xl font-bold text-neutral-900">골 때리는 그녀들</Text>
        <Text className="mt-2 text-sm text-neutral-500">데이터 센터</Text>
      </View>
    </ScrollView>
  );
}
