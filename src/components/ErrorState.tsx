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
    <View className={`flex-1 items-center justify-center px-8 py-16 ${className ?? ''}`}>
      <Text className="text-center text-base font-semibold text-neutral-700">{message}</Text>
      {onRetry && (
        <Button variant="outline" size="sm" onPress={onRetry} className="mt-4">
          다시 시도
        </Button>
      )}
    </View>
  );
}
