import { Inbox, type LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';

type EmptyStateProps = {
  title?: string;
  message?: string;
  description?: string;
  icon?: LucideIcon | React.ReactNode;
  className?: string;
};

export function EmptyState({ title, message, description, icon, className }: EmptyStateProps) {
  const displayTitle = title ?? message ?? '';

  const renderIcon = () => {
    if (!icon) return <Inbox size={28} color="#a3a3a3" />;
    if (typeof icon === 'function') {
      const IconComponent = icon as LucideIcon;
      return <IconComponent size={28} color="#a3a3a3" />;
    }
    return icon;
  };

  return (
    <View className={`flex-1 items-center justify-center px-8 py-20 ${className ?? ''}`}>
      <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
        {renderIcon()}
      </View>
      <Text className="text-center text-base font-semibold text-neutral-700">{displayTitle}</Text>
      {description && (
        <Text className="mt-1.5 text-center text-sm leading-5 text-neutral-400">{description}</Text>
      )}
    </View>
  );
}
