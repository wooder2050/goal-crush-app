import { Text, View } from 'react-native';

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
};

export function EmptyState({ title, description, icon, className }: EmptyStateProps) {
  return (
    <View className={`flex-1 items-center justify-center px-8 py-16 ${className ?? ''}`}>
      {icon && <View className="mb-4">{icon}</View>}
      <Text className="text-center text-base font-semibold text-neutral-700">{title}</Text>
      {description && (
        <Text className="mt-2 text-center text-sm text-neutral-500">{description}</Text>
      )}
    </View>
  );
}
