import { Text, TextProps } from 'react-native';

type TypographyProps = TextProps & {
  children: React.ReactNode;
};

export function H1({ className, ...props }: TypographyProps) {
  return <Text className={`text-2xl font-bold text-neutral-900 ${className ?? ''}`} {...props} />;
}

export function H2({ className, ...props }: TypographyProps) {
  return <Text className={`text-xl font-bold text-neutral-900 ${className ?? ''}`} {...props} />;
}

export function H3({ className, ...props }: TypographyProps) {
  return <Text className={`text-lg font-bold text-neutral-900 ${className ?? ''}`} {...props} />;
}

export function H4({ className, ...props }: TypographyProps) {
  return (
    <Text className={`text-base font-semibold text-neutral-900 ${className ?? ''}`} {...props} />
  );
}

export function Body({ className, ...props }: TypographyProps) {
  return <Text className={`text-sm text-neutral-700 ${className ?? ''}`} {...props} />;
}

export function Caption({ className, ...props }: TypographyProps) {
  return <Text className={`text-xs text-neutral-500 ${className ?? ''}`} {...props} />;
}
