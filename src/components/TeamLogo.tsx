import { Image } from 'expo-image';
import { Text, View } from 'react-native';

type TeamLogoProps = {
  uri: string | null | undefined;
  size?: number;
  teamName?: string;
  className?: string;
};

export function TeamLogo({ uri, size = 32, teamName, className }: TeamLogoProps) {
  const fontSize = Math.max(size * 0.35, 10);

  if (!uri) {
    return (
      <View
        className={`items-center justify-center rounded-full bg-neutral-100 ${className ?? ''}`}
        style={{ width: size, height: size }}
      >
        <Text style={{ fontSize }} className="font-bold text-neutral-400">
          {teamName ? teamName.charAt(0) : '?'}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className={className ?? ''}
      contentFit="cover"
      transition={200}
    />
  );
}
