import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { H3 } from '@/components/ui/Typography';
import type { PlayerStatRow } from '@/features/home/types';

function PlayerRow({
  player,
  rank,
  valueLabel,
  onPress,
}: {
  player: PlayerStatRow;
  rank: number;
  valueLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable className="flex-row items-center py-1.5 active:bg-neutral-50" onPress={onPress}>
      <Text className="w-5 text-center text-xs font-bold text-neutral-400">{rank}</Text>
      {player.player_image ? (
        <Image
          source={{ uri: player.player_image }}
          style={{ width: 28, height: 28 }}
          className="ml-1 rounded-full"
          contentFit="cover"
        />
      ) : (
        <View className="ml-1 h-7 w-7 items-center justify-center rounded-full bg-neutral-200">
          <Text className="text-[10px] font-bold text-neutral-500">
            {player.player_name?.charAt(0)}
          </Text>
        </View>
      )}
      <View className="ml-2 flex-1">
        <Text className="text-sm font-medium text-neutral-900" numberOfLines={1}>
          {player.player_name}
        </Text>
        <Text className="text-[10px] text-neutral-400" numberOfLines={1}>
          {player.team_name}
        </Text>
      </View>
      <Text className="text-sm font-bold text-neutral-900">{valueLabel}</Text>
    </Pressable>
  );
}

function StatColumn({
  title,
  players,
  getValue,
}: {
  title: string;
  players: PlayerStatRow[];
  getValue: (p: PlayerStatRow) => string;
}) {
  const router = useRouter();
  if (!players || players.length === 0) return null;

  return (
    <View className="flex-1">
      <Text className="mb-2 text-center text-xs font-semibold text-neutral-500">{title}</Text>
      {players.slice(0, 5).map((p, i) => (
        <PlayerRow
          key={p.player_id}
          player={p}
          rank={i + 1}
          valueLabel={getValue(p)}
          onPress={() => router.push(`/players/${p.player_id}`)}
        />
      ))}
    </View>
  );
}

export function PlayerStatsWidget({
  topScorers,
  topAssists,
  topRatings,
}: {
  topScorers: PlayerStatRow[];
  topAssists: PlayerStatRow[];
  topRatings: PlayerStatRow[];
}) {
  const hasRatings = topRatings && topRatings.length > 0;
  if (topScorers.length === 0 && topAssists.length === 0) return null;

  return (
    <Card>
      <H3 className="mb-3">선수 통계</H3>
      <View className="flex-row gap-3">
        {hasRatings && (
          <StatColumn
            title="최고 평점"
            players={topRatings}
            getValue={(p) => (p.avg_rating ?? 0).toFixed(1)}
          />
        )}
        <StatColumn title="득점 순위" players={topScorers} getValue={(p) => `${p.goals ?? 0}`} />
        <StatColumn title="도움 순위" players={topAssists} getValue={(p) => `${p.assists ?? 0}`} />
      </View>
    </Card>
  );
}
