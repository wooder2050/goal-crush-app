import { Text, View } from 'react-native';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline';

const variantStyles: Record<BadgeVariant, { container: string; text: string }> = {
  default: { container: 'bg-neutral-100', text: 'text-neutral-700' },
  primary: { container: 'bg-primary/10', text: 'text-primary' },
  success: { container: 'bg-green-100', text: 'text-green-700' },
  warning: { container: 'bg-amber-100', text: 'text-amber-700' },
  danger: { container: 'bg-red-100', text: 'text-red-700' },
  outline: { container: 'border border-neutral-200 bg-transparent', text: 'text-neutral-600' },
};

type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const styles = variantStyles[variant];
  return (
    <View className={`rounded-full px-2 py-0.5 ${styles.container} ${className ?? ''}`}>
      <Text className={`text-xs font-medium ${styles.text}`}>{children}</Text>
    </View>
  );
}
