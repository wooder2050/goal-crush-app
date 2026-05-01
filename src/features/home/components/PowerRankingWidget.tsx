import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import type { PowerRankingRow } from '@/api/stats';
import { getPowerRanking } from '@/api/stats';
import { Card } from '@/components/ui/Card';

const NUM = { fontVariant: ['tabular-nums' as const] };

const POS_COLORS: Record<string, { bg: string; text: string }> = {
  GK: { bg: 'bg-amber-400', text: 'text-white' },
  DF: { bg: 'bg-blue-400', text: 'text-white' },
  MF: { bg: 'bg-emerald-400', text: 'text-white' },
  FW: { bg: 'bg-rose-400', text: 'text-white' },
};

function RankRow({ row, rank }: { row: PowerRankingRow; rank: number }) {
  const router = useRouter();
  const pos = row.position.split('/')[0];
  const pc = POS_COLORS[pos] ?? { bg: 'bg-neutral-200', text: 'text-neutral-600' };

  return (
    <Pressable
      className="flex-row items-center py-2 active:bg-neutral-50"
      onPress={() => router.push(`/players/${row.player_id}`)}
    >
      <View
        className={`h-5 w-5 items-center justify-center rounded-full ${rank <= 3 ? 'bg-primary/10' : ''}`}
      >
        <Text
          className={`text-[10px] font-bold ${rank <= 3 ? 'text-primary' : 'text-neutral-400'}`}
        >
          {rank}
        </Text>
      </View>

      {row.profile_image_url ? (
        <Image
          source={{ uri: row.profile_image_url }}
          style={{ width: 30, height: 30, borderRadius: 15, marginLeft: 6 }}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View className="ml-1.5 h-[30px] w-[30px] items-center justify-center rounded-full bg-neutral-100">
          <Text className="text-[10px] font-bold text-neutral-400">{row.name.charAt(0)}</Text>
        </View>
      )}

      <View className="ml-2 min-w-0 flex-1">
        <View className="flex-row items-center" style={{ gap: 3 }}>
          <Text className="text-sm font-medium text-neutral-800" numberOfLines={1}>
            {row.name}
          </Text>
          <View className={`rounded px-1 py-px ${pc.bg}`}>
            <Text className={`text-[8px] font-bold ${pc.text}`}>{pos}</Text>
          </View>
        </View>
        <Text className="text-[10px] text-neutral-400" numberOfLines={1}>
          {row.team_name}
        </Text>
      </View>

      <View
        className="items-center justify-center rounded-lg px-2 py-0.5"
        style={{
          backgroundColor:
            rank === 1 ? (row.team_color ?? '#ff4800') : rank <= 3 ? '#111827' : '#F3F4F6',
        }}
      >
        <Text
          className={`text-xs font-bold ${rank <= 3 ? 'text-white' : 'text-neutral-700'}`}
          style={NUM}
        >
          {row.power_index.toFixed(1)}
        </Text>
      </View>
    </Pressable>
  );
}

export function PowerRankingWidget() {
  const router = useRouter();

  const { data } = useQuery({
    queryKey: ['powerRanking', 5],
    queryFn: () => getPowerRanking(5),
    staleTime: 10 * 60 * 1000,
  });

  if (!data?.rankings || data.rankings.length === 0) return null;

  return (
    <Card className="p-4">
      <View className="mb-3 flex-row items-center">
        <View className="mr-2 h-4 w-1 rounded-full bg-primary" />
        <Text className="text-base font-bold text-neutral-800">파워랭킹</Text>
      </View>

      {data.rankings.slice(0, 5).map((row, i) => (
        <RankRow key={row.player_id} row={row} rank={i + 1} />
      ))}

      <Pressable
        className="mt-3 flex-row items-center justify-center rounded-xl bg-neutral-50 py-2.5 active:bg-neutral-100"
        onPress={() => router.push('/stats/power-ranking')}
      >
        <Text className="text-[13px] font-semibold text-neutral-500">전체 랭킹 보기</Text>
        <ChevronRight size={14} color="#a3a3a3" style={{ marginLeft: 2 }} />
      </Pressable>
    </Card>
  );
}
