import { ActivityIndicator, Pressable, PressableProps, Text } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

const variantStyles: Record<ButtonVariant, { container: string; text: string }> = {
  primary: { container: 'bg-primary active:bg-primary/90', text: 'text-white' },
  secondary: { container: 'bg-neutral-100 active:bg-neutral-200', text: 'text-neutral-900' },
  outline: {
    container: 'border border-neutral-300 bg-white active:bg-neutral-50',
    text: 'text-neutral-900',
  },
  ghost: { container: 'active:bg-neutral-100', text: 'text-neutral-700' },
  destructive: { container: 'bg-red-500 active:bg-red-600', text: 'text-white' },
};

const sizeStyles: Record<ButtonSize, { container: string; text: string }> = {
  sm: { container: 'h-8 px-3', text: 'text-xs' },
  md: { container: 'h-10 px-4', text: 'text-sm' },
  lg: { container: 'h-12 px-6', text: 'text-base' },
};

type ButtonProps = PressableProps & {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  className?: string;
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      className={`flex-row items-center justify-center rounded-lg ${v.container} ${s.container} ${isDisabled ? 'opacity-50' : ''} ${className ?? ''}`}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? '#fff' : '#525252'} />
      ) : (
        <Text className={`font-semibold ${v.text} ${s.text}`}>{children}</Text>
      )}
    </Pressable>
  );
}
