import { Image } from 'expo-image';
import { Text, View } from 'react-native';

type TeamLogoProps = {
  uri: string | null | undefined;
  size?: number;
  teamName?: string;
  className?: string;
};

export function TeamLogo({ uri, size = 32, teamName, className }: TeamLogoProps) {
  if (!uri) {
    return (
      <View
        className={`items-center justify-center rounded-full bg-neutral-200 ${className ?? ''}`}
        style={{ width: size, height: size }}
      >
        <Text className="text-xs font-bold text-neutral-500">
          {teamName ? teamName.charAt(0) : '?'}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size }}
      className={`rounded-full ${className ?? ''}`}
      contentFit="contain"
    />
  );
}
