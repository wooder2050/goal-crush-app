import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import type { PlayerStatRow } from '@/features/home/types';

const NUM_STYLE = { fontVariant: ['tabular-nums' as const] };

function getRatingColor(rating: number): string {
  if (rating >= 9.0) return '#14A0FF';
  if (rating >= 7.0) return '#33C771';
  return '#FF963F';
}

function PlayerRow({
  player,
  rank,
  statKey,
  onPress,
}: {
  player: PlayerStatRow;
  rank: number;
  statKey: 'goals' | 'assists' | 'avg_rating';
  onPress: () => void;
}) {
  const isRating = statKey === 'avg_rating';
  const statValue = isRating
    ? (player.avg_rating?.toFixed(1) ?? '0')
    : String(player[statKey] ?? 0);

  const isFirst = rank === 1;
  const teamColor = player.team_primary_color;

  return (
    <Pressable className="flex-row items-center py-2 active:bg-neutral-50" onPress={onPress}>
      <View
        className={`h-5 w-5 items-center justify-center rounded-full ${rank <= 3 ? 'bg-primary/10' : ''}`}
      >
        <Text
          className={`text-[10px] font-bold ${rank <= 3 ? 'text-primary' : 'text-neutral-400'}`}
        >
          {rank}
        </Text>
      </View>

      {player.player_image ? (
        <Image
          source={{ uri: player.player_image }}
          style={{ width: 30, height: 30, borderRadius: 15, marginLeft: 6 }}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View className="ml-1.5 h-[30px] w-[30px] items-center justify-center rounded-full bg-neutral-100">
          <Text className="text-[10px] font-bold text-neutral-400">
            {player.player_name?.charAt(0)}
          </Text>
        </View>
      )}

      <View className="ml-2 min-w-0 flex-1">
        <Text className="text-sm font-medium text-neutral-800" numberOfLines={1}>
          {player.player_name}
        </Text>
        <Text className="text-[10px] text-neutral-400" numberOfLines={1}>
          {player.team_name}
        </Text>
      </View>

      {isRating ? (
        <View
          className="items-center justify-center rounded-md px-1.5 py-0.5"
          style={{ backgroundColor: getRatingColor(player.avg_rating ?? 0) }}
        >
          <Text className="text-xs font-bold text-white" style={NUM_STYLE}>
            {statValue}
          </Text>
        </View>
      ) : isFirst && teamColor ? (
        <View
          className="items-center justify-center rounded-full px-2 py-0.5"
          style={{ backgroundColor: teamColor }}
        >
          <Text
            className="text-xs font-semibold"
            style={{ ...NUM_STYLE, color: player.team_secondary_color ?? '#FFFFFF' }}
          >
            {statValue}
          </Text>
        </View>
      ) : (
        <Text className="text-sm font-bold text-neutral-900" style={NUM_STYLE}>
          {statValue}
        </Text>
      )}
    </Pressable>
  );
}

function StatSection({
  players,
  statKey,
}: {
  players: PlayerStatRow[];
  statKey: 'goals' | 'assists' | 'avg_rating';
}) {
  const router = useRouter();
  if (!players || players.length === 0) return null;

  return (
    <View>
      {players.slice(0, 5).map((p, i) => (
        <PlayerRow
          key={p.player_id ?? i}
          player={p}
          rank={i + 1}
          statKey={statKey}
          onPress={() => {
            if (p.player_id != null) {
              router.push(`/players/${p.player_id}`);
            }
          }}
        />
      ))}
    </View>
  );
}

type TabKey = 'statsRating' | 'xtRating' | 'goals' | 'assists';

export function PlayerStatsWidget({
  topScorers,
  topAssists,
  topRatings,
  topXtRatings,
  seasonId,
}: {
  topScorers: PlayerStatRow[];
  topAssists: PlayerStatRow[];
  topRatings: PlayerStatRow[];
  topXtRatings: PlayerStatRow[];
  seasonId?: number;
}) {
  const router = useRouter();
  const hasStatsRatings = topRatings && topRatings.length > 0;
  const hasXtRatings = topXtRatings && topXtRatings.length > 0;
  const hasRatings = hasStatsRatings || hasXtRatings;

  const [tab, setTab] = useState<TabKey>(() => {
    if (hasStatsRatings) return 'statsRating';
    if (hasXtRatings) return 'xtRating';
    if (topScorers.length > 0) return 'goals';
    return 'assists';
  });

  if (topScorers.length === 0 && topAssists.length === 0 && !hasRatings) return null;

  const tabs: { key: TabKey; label: string }[] = [
    ...(hasStatsRatings ? [{ key: 'statsRating' as const, label: '스탯평점' }] : []),
    ...(hasXtRatings ? [{ key: 'xtRating' as const, label: 'xT평점' }] : []),
    { key: 'goals' as const, label: '득점' },
    { key: 'assists' as const, label: '도움' },
  ];

  return (
    <Card className="p-4">
      <View className="mb-3 flex-row items-center">
        <View className="mr-2 h-4 w-1 rounded-full bg-primary" />
        <Text className="text-base font-bold text-neutral-800">선수 통계</Text>
      </View>

      {/* 탭 */}
      <View className="mb-3 flex-row rounded-lg bg-neutral-100 p-0.5">
        {tabs.map((t) => (
          <Pressable
            key={t.key}
            className={`flex-1 items-center rounded-md py-1.5 ${tab === t.key ? 'bg-white' : ''}`}
            onPress={() => setTab(t.key)}
          >
            <Text
              className={`text-xs font-bold ${tab === t.key ? 'text-neutral-800' : 'text-neutral-400'}`}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 콘텐츠 */}
      {tab === 'statsRating' && hasStatsRatings && (
        <StatSection players={topRatings} statKey="avg_rating" />
      )}
      {tab === 'xtRating' && hasXtRatings && (
        <StatSection players={topXtRatings} statKey="avg_rating" />
      )}
      {tab === 'goals' && <StatSection players={topScorers} statKey="goals" />}
      {tab === 'assists' && <StatSection players={topAssists} statKey="assists" />}

      {/* 전체 순위 보기 */}
      {seasonId && (
        <Pressable
          className="mt-3 flex-row items-center justify-center rounded-xl bg-neutral-50 py-2.5 active:bg-neutral-100"
          onPress={() => router.push(`/seasons/${seasonId}?tab=players`)}
        >
          <Text className="text-[13px] font-semibold text-neutral-500">전체 순위 보기</Text>
          <ChevronRight size={14} color="#a3a3a3" style={{ marginLeft: 2 }} />
        </Pressable>
      )}
    </Card>
  );
}
