import { AlertCircle } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';

type ErrorStateProps = {
  message?: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  message = '데이터를 불러오는 데 실패했습니다.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <View className={`flex-1 items-center justify-center px-8 py-20 ${className ?? ''}`}>
      <View className="mb-4 h-12 w-12 items-center justify-center rounded-full bg-red-50">
        <AlertCircle size={24} color="#ef4444" />
      </View>
      <Text className="text-center text-base font-semibold text-neutral-800">{message}</Text>
      <Text className="mt-1 text-center text-sm text-neutral-400">
        네트워크 연결을 확인해주세요.
      </Text>
      {onRetry && (
        <Button variant="outline" size="sm" onPress={onRetry} className="mt-5">
          다시 시도
        </Button>
      )}
    </View>
  );
}
