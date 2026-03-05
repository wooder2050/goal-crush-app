import { Pressable, PressableProps, StyleSheet, View, ViewProps } from 'react-native';

const shadow = StyleSheet.create({
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
});

type CardProps = ViewProps & {
  children: React.ReactNode;
};

export function Card({ className, style, ...props }: CardProps) {
  return (
    <View
      className={`rounded-2xl border border-neutral-100 bg-white p-4 ${className ?? ''}`}
      style={[shadow.card, style]}
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
      className={`rounded-2xl border border-neutral-100 bg-white p-4 active:bg-neutral-50/80 ${className ?? ''}`}
      style={shadow.card}
      {...props}
    />
  );
}
