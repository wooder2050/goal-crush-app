import { Text, TextProps } from 'react-native';

type TypographyProps = TextProps & {
  children: React.ReactNode;
};

export function H1({ className, ...props }: TypographyProps) {
  return (
    <Text
      className={`text-2xl font-bold tracking-tight text-neutral-900 ${className ?? ''}`}
      {...props}
    />
  );
}

export function H2({ className, ...props }: TypographyProps) {
  return (
    <Text
      className={`text-xl font-bold tracking-tight text-neutral-900 ${className ?? ''}`}
      {...props}
    />
  );
}

export function H3({ className, ...props }: TypographyProps) {
  return <Text className={`text-lg font-bold text-neutral-900 ${className ?? ''}`} {...props} />;
}

export function H4({ className, ...props }: TypographyProps) {
  return (
    <Text className={`text-base font-semibold text-neutral-800 ${className ?? ''}`} {...props} />
  );
}

export function Body({ className, ...props }: TypographyProps) {
  return <Text className={`text-sm leading-5 text-neutral-600 ${className ?? ''}`} {...props} />;
}

export function Caption({ className, ...props }: TypographyProps) {
  return <Text className={`text-xs text-neutral-400 ${className ?? ''}`} {...props} />;
}
