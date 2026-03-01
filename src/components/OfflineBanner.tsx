import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  if (!isOffline) return null;

  return (
    <View className="bg-red-500 px-4 py-2">
      <Text className="text-center text-xs font-medium text-white">
        오프라인 상태입니다. 일부 기능이 제한될 수 있습니다.
      </Text>
    </View>
  );
}
