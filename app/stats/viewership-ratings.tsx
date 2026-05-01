import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Stack, useRouter } from 'expo-router';
import { ChevronDown, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, Text, View } from 'react-native';

import type { ViewershipRatingData } from '@/api/stats';
import { getViewershipRatings } from '@/api/stats';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card } from '@/components/ui/Card';
import { sanitizeLabel } from '@/lib/utils';

const NUM = { fontVariant: ['tabular-nums' as const] };
const PAGE_SIZE = 20;

type SortOption = 'latest' | 'highest' | 'lowest';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'latest', label: '최신순' },
  { value: 'highest', label: '높은 순' },
  { value: 'lowest', label: '낮은 순' },
];

/* ── 필터 바텀시트 ── */
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
              className={`rounded-xl px-4 py-3 ${selected === opt.value ? 'bg-primary/10' : ''}`}
              onPress={() => {
                onSelect(opt.value);
                onClose();
              }}
            >
              <Text
                className={`text-sm ${selected === opt.value ? 'font-bold text-primary' : 'text-neutral-700'}`}
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
      className={`flex-row items-center rounded-full px-3 py-1.5 ${active ? 'bg-primary/10' : 'bg-neutral-100'}`}
      onPress={onPress}
    >
      <Text className={`text-xs font-semibold ${active ? 'text-primary' : 'text-neutral-500'}`}>
        {label}
      </Text>
      <ChevronDown size={12} color={active ? '#ff4800' : '#a3a3a3'} style={{ marginLeft: 2 }} />
    </Pressable>
  );
}

/* ── TOP 10 항목 ── */
function TopMatchRow({
  item,
  rank,
  onPress,
}: {
  item: ViewershipRatingData;
  rank: number;
  onPress: () => void;
}) {
  return (
    <Pressable className="flex-row items-center py-2.5 active:bg-neutral-50" onPress={onPress}>
      <View
        className={`h-5 w-5 items-center justify-center rounded-full ${rank <= 3 ? 'bg-primary/10' : 'bg-neutral-100'}`}
      >
        <Text
          className={`text-[10px] font-bold ${rank <= 3 ? 'text-primary' : 'text-neutral-500'}`}
        >
          {rank}
        </Text>
      </View>
      <View className="ml-2.5 flex-1">
        <Text className="text-xs font-medium text-neutral-700" numberOfLines={1}>
          {sanitizeLabel(item.label)}
        </Text>
        <Text className="text-[10px] text-neutral-400">
          {format(new Date(item.match_date), 'yy.M.d')}
          {item.season ? ` · ${sanitizeLabel(item.season.season_name)}` : ''}
        </Text>
      </View>
      <Text className="text-sm font-bold text-primary" style={NUM}>
        {item.rating_nationwide?.toFixed(1)}%
      </Text>
    </Pressable>
  );
}

/* ── 시즌별 요약 행 ── */
function SeasonSummaryRow({
  name,
  count,
  avg,
  max,
  min,
}: {
  name: string;
  count: number;
  avg: string;
  max: string;
  min: string;
}) {
  return (
    <View className="flex-row items-center border-b border-neutral-50 py-2.5">
      <Text className="flex-1 text-xs text-neutral-700" numberOfLines={1}>
        {sanitizeLabel(name)}
      </Text>
      <Text className="w-8 text-center text-[11px] text-neutral-500" style={NUM}>
        {count}
      </Text>
      <Text className="w-12 text-center text-[11px] font-bold text-neutral-700" style={NUM}>
        {avg}
      </Text>
      <Text className="w-12 text-center text-[11px] text-primary" style={NUM}>
        {max}
      </Text>
      <Text className="w-12 text-center text-[11px] text-neutral-400" style={NUM}>
        {min}
      </Text>
    </View>
  );
}

/* ── 메인 페이지 ── */
export default function ViewershipRatingsPage() {
  const router = useRouter();
  const [seasonFilter, setSeasonFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [showSeasonSheet, setShowSeasonSheet] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['viewershipRatings'],
    queryFn: () => getViewershipRatings(),
    staleTime: 10 * 60 * 1000,
  });

  const seasonOptions = useMemo(() => {
    if (!data) return [];
    const map = new Map<number, string>();
    data.forEach((d) => {
      if (d.season) map.set(d.season.season_id, d.season.season_name);
    });
    return [
      { value: 0 as number, label: '전체 시즌' },
      ...[...map.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([id, name]) => ({ value: id, label: sanitizeLabel(name) })),
    ];
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    let list = [...data];
    if (seasonFilter) list = list.filter((d) => d.season?.season_id === seasonFilter);

    switch (sortBy) {
      case 'highest':
        list.sort((a, b) => (b.rating_nationwide ?? 0) - (a.rating_nationwide ?? 0));
        break;
      case 'lowest':
        list.sort((a, b) => (a.rating_nationwide ?? 0) - (b.rating_nationwide ?? 0));
        break;
      default:
        list.sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());
    }
    return list;
  }, [data, seasonFilter, sortBy]);

  const top10 = useMemo(() => {
    if (!data) return [];
    return [...data]
      .filter((d) => d.rating_nationwide != null)
      .sort((a, b) => (b.rating_nationwide ?? 0) - (a.rating_nationwide ?? 0))
      .slice(0, 10);
  }, [data]);

  const seasonStats = useMemo(() => {
    if (!data) return [];
    const map = new Map<number, { name: string; ratings: number[] }>();
    data.forEach((d) => {
      if (!d.season || d.rating_nationwide == null) return;
      const entry = map.get(d.season.season_id) ?? { name: d.season.season_name, ratings: [] };
      entry.ratings.push(d.rating_nationwide);
      map.set(d.season.season_id, entry);
    });
    return [...map.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([id, { name, ratings }]) => ({
        id,
        name,
        count: ratings.length,
        avg: (ratings.reduce((s, v) => s + v, 0) / ratings.length).toFixed(1),
        max: Math.max(...ratings).toFixed(1),
        min: Math.min(...ratings).toFixed(1),
      }));
  }, [data]);

  const paged = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = paged.length < filtered.length;

  const avgNationwide = useMemo(() => {
    const valid = filtered.filter((d) => d.rating_nationwide != null);
    if (valid.length === 0) return null;
    return (valid.reduce((s, d) => s + (d.rating_nationwide ?? 0), 0) / valid.length).toFixed(1);
  }, [filtered]);

  const seasonLabel = seasonFilter
    ? (seasonOptions.find((s) => s.value === seasonFilter)?.label ?? '시즌')
    : '전체 시즌';
  const sortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? '정렬';

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <>
      <Stack.Screen
        options={{
          title: '방송 데이터',
          headerShown: true,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <FlatList
        className="flex-1 bg-neutral-50"
        data={paged}
        keyExtractor={(item) => String(item.match_id)}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (hasMore) setPage((p) => p + 1);
        }}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View style={{ gap: 12 }} className="px-4 pb-2 pt-4">
            {top10.length > 0 && (
              <Card className="p-4">
                <Text className="mb-3 text-sm font-bold text-neutral-800">TOP 10</Text>
                {top10.map((item, i) => (
                  <TopMatchRow
                    key={item.match_id}
                    item={item}
                    rank={i + 1}
                    onPress={() => router.push(`/matches/${item.match_id}`)}
                  />
                ))}
              </Card>
            )}

            {seasonStats.length > 0 && (
              <Card className="p-4">
                <Text className="mb-3 text-sm font-bold text-neutral-800">시즌별 요약</Text>
                <View className="mb-2 flex-row border-b border-neutral-100 pb-1.5">
                  <Text className="flex-1 text-[10px] font-medium text-neutral-400">시즌</Text>
                  <Text className="w-8 text-center text-[10px] font-medium text-neutral-400">
                    경기
                  </Text>
                  <Text className="w-12 text-center text-[10px] font-medium text-neutral-400">
                    평균
                  </Text>
                  <Text className="w-12 text-center text-[10px] font-medium text-neutral-400">
                    최고
                  </Text>
                  <Text className="w-12 text-center text-[10px] font-medium text-neutral-400">
                    최저
                  </Text>
                </View>
                {seasonStats.map((s) => (
                  <SeasonSummaryRow key={s.id} {...s} />
                ))}
              </Card>
            )}

            <View className="mt-2">
              <Text className="mb-2 text-sm font-bold text-neutral-800">경기별 데이터</Text>
              <View className="flex-row" style={{ gap: 8 }}>
                <FilterChip
                  label={seasonLabel}
                  active={seasonFilter !== null}
                  onPress={() => setShowSeasonSheet(true)}
                />
                <FilterChip
                  label={sortLabel}
                  active={sortBy !== 'latest'}
                  onPress={() => setShowSortSheet(true)}
                />
              </View>
              {avgNationwide && (
                <Text className="mt-2 text-[11px] text-neutral-400">
                  평균: <Text className="font-bold text-primary">{avgNationwide}%</Text> (
                  {filtered.length}경기)
                </Text>
              )}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            className="flex-row items-center bg-white px-4 py-3 active:bg-neutral-50"
            onPress={() => router.push(`/matches/${item.match_id}`)}
          >
            <View className="flex-1">
              <Text className="text-xs font-medium text-neutral-700" numberOfLines={1}>
                {sanitizeLabel(item.label)}
              </Text>
              <View className="mt-0.5 flex-row items-center" style={{ gap: 6 }}>
                <Text className="text-[10px] text-neutral-400" style={NUM}>
                  {format(new Date(item.match_date), 'yy.M.d')}
                </Text>
                {item.season && (
                  <>
                    <View className="h-2.5 w-px bg-neutral-200" />
                    <Text className="text-[10px] text-neutral-400">
                      {sanitizeLabel(item.season.season_name)}
                    </Text>
                  </>
                )}
              </View>
            </View>
            <View className="items-end">
              <Text className="text-sm font-bold text-primary" style={NUM}>
                {item.rating_nationwide != null ? `${item.rating_nationwide.toFixed(1)}%` : '-'}
              </Text>
              {item.rating_metropolitan != null && (
                <Text className="text-[10px] text-blue-400" style={NUM}>
                  수도권 {item.rating_metropolitan.toFixed(1)}%
                </Text>
              )}
            </View>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View className="h-px bg-neutral-50" />}
        ListEmptyComponent={<EmptyState title="데이터가 없습니다." />}
        contentContainerStyle={{ paddingBottom: 32 }}
      />

      <FilterSheet
        visible={showSeasonSheet}
        onClose={() => setShowSeasonSheet(false)}
        title="시즌"
        options={seasonOptions}
        selected={seasonFilter ?? 0}
        onSelect={(v) => {
          setSeasonFilter(v === 0 ? null : v);
          setPage(1);
        }}
      />

      <FilterSheet
        visible={showSortSheet}
        onClose={() => setShowSortSheet(false)}
        title="정렬 기준"
        options={SORT_OPTIONS}
        selected={sortBy}
        onSelect={(v) => {
          setSortBy(v);
          setPage(1);
        }}
      />
    </>
  );
}
