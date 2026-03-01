import { Pressable, PressableProps, View, ViewProps } from 'react-native';

type CardProps = ViewProps & {
  children: React.ReactNode;
};

export function Card({ className, ...props }: CardProps) {
  return (
    <View
      className={`rounded-xl border border-neutral-200 bg-white p-4 ${className ?? ''}`}
      {...props}
    />
  );
}

type PressableCardProps = PressableProps & {
  children: React.ReactNode;
  className?: string;
};

export function PressableCard({ className, ...props }: PressableCardProps) {
  return (
    <Pressable
      className={`rounded-xl border border-neutral-200 bg-white p-4 active:bg-neutral-50 ${className ?? ''}`}
      {...props}
    />
  );
}
