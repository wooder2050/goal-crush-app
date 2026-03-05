import { Text, View } from 'react-native';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline';

const variantStyles: Record<BadgeVariant, { container: string; text: string }> = {
  default: { container: 'bg-neutral-100', text: 'text-neutral-600' },
  primary: { container: 'bg-primary/10', text: 'text-primary' },
  success: { container: 'bg-emerald-50', text: 'text-emerald-600' },
  warning: { container: 'bg-amber-50', text: 'text-amber-600' },
  danger: { container: 'bg-red-50', text: 'text-red-600' },
  outline: { container: 'border border-neutral-200 bg-white', text: 'text-neutral-500' },
};

type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const styles = variantStyles[variant];
  return (
    <View className={`rounded-full px-2.5 py-1 ${styles.container} ${className ?? ''}`}>
      <Text className={`text-[11px] font-semibold ${styles.text}`}>{children}</Text>
    </View>
  );
}
