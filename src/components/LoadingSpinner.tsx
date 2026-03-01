import { ActivityIndicator, View } from 'react-native';

type LoadingSpinnerProps = {
  size?: 'small' | 'large';
  className?: string;
};

export function LoadingSpinner({ size = 'large', className }: LoadingSpinnerProps) {
  return (
    <View className={`flex-1 items-center justify-center ${className ?? ''}`}>
      <ActivityIndicator size={size} color="#ff4800" />
    </View>
  );
}
