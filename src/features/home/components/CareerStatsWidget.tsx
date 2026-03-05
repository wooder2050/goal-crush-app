import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import type { CareerStatRow } from '@/features/home/types';

const NUM_STYLE = { fontVariant: ['tabular-nums' as const] };

type StatKey =
  | 'goals'
  | 'assists'
  | 'goals_per_match'
  | 'assists_per_match'
  | 'attack_points'
  | 'attack_points_per_match';

function CareerPlayerRow({
  player,
  rank,
  statKey,
  onPress,
}: {
  player: CareerStatRow;
  rank: number;
  statKey: StatKey;
  onPress: () => void;
}) {
  const isPerMatch =
    statKey === 'goals_per_match' ||
    statKey === 'assists_per_match' ||
    statKey === 'attack_points_per_match';
  const statValue = isPerMatch
    ? (player[statKey]?.toFixed(2) ?? '0.00')
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

      {isFirst && teamColor ? (
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

function CareerColumn({
  title,
  players,
  statKey,
  subtitle,
}: {
  title: string;
  players: CareerStatRow[];
  statKey: StatKey;
  subtitle?: string;
}) {
  const router = useRouter();
  if (!players || players.length === 0) return null;

  return (
    <View>
      <View className="mb-1 flex-row items-center">
        <Text className="text-xs font-semibold text-neutral-600">{title}</Text>
        {subtitle && <Text className="ml-1 text-[10px] text-neutral-400">({subtitle})</Text>}
      </View>
      {players.slice(0, 5).map((p, i) => (
        <CareerPlayerRow
          key={p.player_id}
          player={p}
          rank={i + 1}
          statKey={statKey}
          onPress={() => router.push(`/players/${p.player_id}`)}
        />
      ))}
    </View>
  );
}

type TabKey = 'goals' | 'assists' | 'attackPoints';

interface CareerStatsWidgetProps {
  careerTopScorers: CareerStatRow[];
  careerTopAssists: CareerStatRow[];
  careerGoalsPerMatch: CareerStatRow[];
  careerAssistsPerMatch: CareerStatRow[];
  careerAttackPoints: CareerStatRow[];
  careerAttackPointsPerMatch: CareerStatRow[];
}

export function CareerStatsWidget({
  careerTopScorers,
  careerTopAssists,
  careerGoalsPerMatch,
  careerAssistsPerMatch,
  careerAttackPoints,
  careerAttackPointsPerMatch,
}: CareerStatsWidgetProps) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('goals');

  const hasData =
    careerTopScorers.length > 0 || careerTopAssists.length > 0 || careerAttackPoints.length > 0;

  if (!hasData) return null;

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'goals', label: '득점' },
    { key: 'assists', label: '도움' },
    { key: 'attackPoints', label: '공격포인트' },
  ];

  return (
    <Card className="p-4">
      <View className="mb-3 flex-row items-center">
        <View className="mr-2 h-4 w-1 rounded-full bg-primary" />
        <Text className="text-base font-bold text-neutral-800">통산 기록</Text>
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
      {tab === 'goals' && (
        <View className="gap-4">
          <CareerColumn title="통산 득점" players={careerTopScorers} statKey="goals" />
          <CareerColumn
            title="경기당 득점"
            players={careerGoalsPerMatch}
            statKey="goals_per_match"
            subtitle="최소 10경기"
          />
        </View>
      )}
      {tab === 'assists' && (
        <View className="gap-4">
          <CareerColumn title="통산 도움" players={careerTopAssists} statKey="assists" />
          <CareerColumn
            title="경기당 도움"
            players={careerAssistsPerMatch}
            statKey="assists_per_match"
            subtitle="최소 10경기"
          />
        </View>
      )}
      {tab === 'attackPoints' && (
        <View className="gap-4">
          <CareerColumn
            title="통산 공격포인트"
            players={careerAttackPoints}
            statKey="attack_points"
          />
          <CareerColumn
            title="경기당 공격포인트"
            players={careerAttackPointsPerMatch}
            statKey="attack_points_per_match"
            subtitle="최소 10경기"
          />
        </View>
      )}

      {/* 전체 통산 기록 보기 */}
      <Pressable
        className="mt-3 flex-row items-center justify-center rounded-xl bg-neutral-50 py-2.5 active:bg-neutral-100"
        onPress={() => router.push('/stats/scoring')}
      >
        <Text className="text-[13px] font-semibold text-neutral-500">전체 통산 기록 보기</Text>
        <ChevronRight size={14} color="#a3a3a3" style={{ marginLeft: 2 }} />
      </Pressable>
    </Card>
  );
}
