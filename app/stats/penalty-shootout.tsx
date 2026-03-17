import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { ChevronDown, X } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { getAllSeasonsPrisma } from '@/api/seasons';
import { getPenaltyShootout, GoalkeeperPKRanking, KickerRanking } from '@/api/stats';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { sanitizeLabel } from '@/lib/utils';

const NUM = { fontVariant: ['tabular-nums' as const] };

type PKType = 'kicker' | 'goalkeeper';

/* ── 정렬 옵션 ── */
const KICKER_SORT_OPTIONS = [
  { value: 'total', label: '많이 찬 순' },
  { value: 'success_rate_high', label: '성공률 높은 순' },
  { value: 'success_rate_low', label: '성공률 낮은 순' },
] as const;

const GK_SORT_OPTIONS = [
  { value: 'total', label: '많이 상대한 순' },
  { value: 'save_rate_high', label: '선방률 높은 순' },
  { value: 'save_rate_low', label: '선방률 낮은 순' },
] as const;

/* ── 최소 횟수 ── */
const _MIN_ATTEMPTS_OPTIONS = [1, 3, 5, 10] as const;

/* ── 순위 뱃지 ── */
function RankBadge({ rank }: { rank: number }) {
  const bg = rank <= 3 ? 'bg-teal-500/10' : 'bg-neutral-100';
  const text = rank <= 3 ? 'text-teal-600' : 'text-neutral-500';
  return (
    <View className={`h-6 w-6 items-center justify-center rounded-full ${bg}`}>
      <Text className={`text-xs font-bold ${text}`}>{rank}</Text>
    </View>
  );
}

/* ── 필터 칩 ── */
function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={`flex-row items-center rounded-full px-3 py-1.5 ${active ? 'bg-teal-500/10' : 'bg-neutral-100'}`}
      onPress={onPress}
    >
      <Text className={`text-xs font-semibold ${active ? 'text-teal-600' : 'text-neutral-500'}`}>
        {label}
      </Text>
      <ChevronDown size={12} color={active ? '#0d9488' : '#a3a3a3'} style={{ marginLeft: 2 }} />
    </Pressable>
  );
}

/* ── 바텀시트 ── */
function FilterSheet<T extends string | number>({
  visible,
  onClose,
  title,
  options,
  selected,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (v: T) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <View className="rounded-t-3xl bg-white px-5 pb-10 pt-4" style={{ maxHeight: '50%' }}>
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-base font-bold text-neutral-800">{title}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <X size={20} color="#737373" />
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {options.map((opt) => (
            <Pressable
              key={String(opt.value)}
              className={`rounded-xl px-4 py-3 ${selected === opt.value ? 'bg-teal-500/10' : ''}`}
              onPress={() => {
                onSelect(opt.value);
                onClose();
              }}
            >
              <Text
                className={`text-sm ${selected === opt.value ? 'font-bold text-teal-600' : 'text-neutral-700'}`}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ── 키커 Row ── */
function KickerRow({ player }: { player: KickerRanking }) {
  const router = useRouter();
  return (
    <Pressable
      className="flex-row items-center px-4 py-3.5 active:bg-neutral-50"
      onPress={() => router.push(`/players/${player.player_id}`)}
    >
      <RankBadge rank={player.rank} />
      <View style={{ position: 'relative', marginLeft: 8 }}>
        {player.player_image ? (
          <Image
            source={{ uri: player.player_image }}
            style={{ width: 36, height: 36, borderRadius: 18 }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View className="h-9 w-9 items-center justify-center rounded-full bg-neutral-100">
            <Text className="text-sm font-bold text-neutral-400">
              {player.player_name?.charAt(0)}
            </Text>
          </View>
        )}
        {player.team_logos && player.team_logos.length > 0 && (
          <View
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: '#fff',
              padding: 1.5,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 1,
              elevation: 2,
            }}
          >
            <Image
              source={{ uri: player.team_logos[0] }}
              style={{ width: 15, height: 15, borderRadius: 7.5 }}
              contentFit="cover"
            />
          </View>
        )}
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-sm font-semibold text-neutral-900">{player.player_name}</Text>
        <Text className="text-xs text-neutral-500">{player.first_team_name}</Text>
      </View>
      <View className="items-end">
        <Text className="text-base font-bold text-emerald-600" style={NUM}>
          {player.success_rate}%
        </Text>
        <Text className="text-[10px] text-neutral-400">
          {player.successful_kicks}/{player.total_kicks} 성공
        </Text>
      </View>
    </Pressable>
  );
}

/* ── 골키퍼 PK Row ── */
function GKPKRow({ player }: { player: GoalkeeperPKRanking }) {
  const router = useRouter();
  return (
    <Pressable
      className="flex-row items-center px-4 py-3.5 active:bg-neutral-50"
      onPress={() => router.push(`/players/${player.player_id}`)}
    >
      <RankBadge rank={player.rank} />
      <View style={{ position: 'relative', marginLeft: 8 }}>
        {player.player_image ? (
          <Image
            source={{ uri: player.player_image }}
            style={{ width: 36, height: 36, borderRadius: 18 }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View className="h-9 w-9 items-center justify-center rounded-full bg-neutral-100">
            <Text className="text-sm font-bold text-neutral-400">
              {player.player_name?.charAt(0)}
            </Text>
          </View>
        )}
        {player.team_logos && player.team_logos.length > 0 && (
          <View
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: '#fff',
              padding: 1.5,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 1,
              elevation: 2,
            }}
          >
            <Image
              source={{ uri: player.team_logos[0] }}
              style={{ width: 15, height: 15, borderRadius: 7.5 }}
              contentFit="cover"
            />
          </View>
        )}
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-sm font-semibold text-neutral-900">{player.player_name}</Text>
        <Text className="text-xs text-neutral-500">{player.first_team_name}</Text>
      </View>
      <View className="items-end">
        <Text className="text-base font-bold text-blue-600" style={NUM}>
          {player.save_rate}%
        </Text>
        <Text className="text-[10px] text-neutral-400">
          {player.saves}/{player.total_faced} 선방
        </Text>
      </View>
    </Pressable>
  );
}

/* ── 메인 페이지 ── */
export default function PenaltyShootoutPage() {
  const [seasonId, setSeasonId] = useState<number | null>(null);
  const [type, setType] = useState<PKType>('kicker');
  const [kickerSort, setKickerSort] = useState('total');
  const [gkSort, setGkSort] = useState('total');
  const [showSeasonSheet, setShowSeasonSheet] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);

  const { data: seasons } = useQuery({
    queryKey: ['allSeasons'],
    queryFn: getAllSeasonsPrisma,
    staleTime: 10 * 60 * 1000,
  });

  const seasonLabel = seasonId
    ? sanitizeLabel(seasons?.find((s) => s.season_id === seasonId)?.season_name) || '시즌'
    : '전체 시즌';

  const currentSort = type === 'kicker' ? kickerSort : gkSort;
  const sortOptions = type === 'kicker' ? KICKER_SORT_OPTIONS : GK_SORT_OPTIONS;
  const sortLabel = sortOptions.find((o) => o.value === currentSort)?.label ?? '정렬';

  const seasonOptions = [
    { value: 0 as number, label: '전체 시즌' },
    ...(seasons?.map((s) => ({ value: s.season_id, label: sanitizeLabel(s.season_name) })) ?? []),
  ];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['penaltyShootout', type, seasonId, currentSort],
    queryFn: () =>
      getPenaltyShootout({
        type,
        season_id: seasonId ?? undefined,
        limit: 50,
        sort_by: currentSort,
      }),
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: '승부차기',
          headerShown: true,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <View className="flex-1 bg-neutral-50">
        {/* 타입 토글 + 필터 */}
        <View className="bg-white px-4 pb-3 pt-2">
          {/* 키커/골키퍼 토글 */}
          <View className="flex-row rounded-xl bg-neutral-100 p-1">
            <Pressable
              className={`flex-1 items-center rounded-lg py-2 ${type === 'kicker' ? 'bg-white' : ''}`}
              onPress={() => setType('kicker')}
              style={
                type === 'kicker'
                  ? {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.06,
                      shadowRadius: 2,
                      elevation: 1,
                    }
                  : undefined
              }
            >
              <Text
                className={`text-sm font-semibold ${type === 'kicker' ? 'text-neutral-900' : 'text-neutral-400'}`}
              >
                키커
              </Text>
            </Pressable>
            <Pressable
              className={`flex-1 items-center rounded-lg py-2 ${type === 'goalkeeper' ? 'bg-white' : ''}`}
              onPress={() => setType('goalkeeper')}
              style={
                type === 'goalkeeper'
                  ? {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.06,
                      shadowRadius: 2,
                      elevation: 1,
                    }
                  : undefined
              }
            >
              <Text
                className={`text-sm font-semibold ${type === 'goalkeeper' ? 'text-neutral-900' : 'text-neutral-400'}`}
              >
                골키퍼
              </Text>
            </Pressable>
          </View>

          {/* 필터 칩 */}
          <View className="mt-2 flex-row flex-wrap" style={{ gap: 8 }}>
            <FilterChip
              label={seasonLabel}
              active={seasonId !== null}
              onPress={() => setShowSeasonSheet(true)}
            />
            <FilterChip
              label={sortLabel}
              active={currentSort !== 'total'}
              onPress={() => setShowSortSheet(true)}
            />
          </View>
        </View>

        {/* 목록 */}
        {isLoading ? (
          <LoadingSpinner />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : type === 'kicker' ? (
          <FlatList
            data={(data?.rankings as KickerRanking[]) ?? []}
            keyExtractor={(item) => String(item.player_id)}
            renderItem={({ item }) => <KickerRow player={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
            ListEmptyComponent={<EmptyState title="데이터가 없습니다." />}
          />
        ) : (
          <FlatList
            data={(data?.rankings as GoalkeeperPKRanking[]) ?? []}
            keyExtractor={(item) => String(item.player_id)}
            renderItem={({ item }) => <GKPKRow player={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
            ListEmptyComponent={<EmptyState title="데이터가 없습니다." />}
          />
        )}
      </View>

      {/* 시즌 */}
      <FilterSheet
        visible={showSeasonSheet}
        onClose={() => setShowSeasonSheet(false)}
        title="시즌"
        options={seasonOptions}
        selected={seasonId ?? 0}
        onSelect={(v) => setSeasonId(v === 0 ? null : v)}
      />
      {/* 정렬 */}
      <FilterSheet
        visible={showSortSheet}
        onClose={() => setShowSortSheet(false)}
        title="정렬 기준"
        options={sortOptions.map((o) => ({ value: o.value, label: o.label }))}
        selected={currentSort}
        onSelect={(v) => {
          if (type === 'kicker') {
            setKickerSort(v);
          } else {
            setGkSort(v);
          }
        }}
      />
    </>
  );
}
