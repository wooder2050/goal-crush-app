import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ChevronDown, Search, SearchX, X } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { getPlayersPagePrisma, PlayersPageItem } from '@/api/players';
import { getAllSeasonsPrisma } from '@/api/seasons';
import { getTeamsPrisma } from '@/api/teams';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TeamLogo } from '@/components/TeamLogo';
import { PressableCard } from '@/components/ui/Card';
import { sanitizeLabel } from '@/lib/utils';

const NUM = { fontVariant: ['tabular-nums' as const] };

const POSITIONS = [
  { key: '', label: '전체' },
  { key: 'FW', label: '공격수' },
  { key: 'MF', label: '미드필더' },
  { key: 'DF', label: '수비수' },
  { key: 'GK', label: '골키퍼' },
];

const POSITION_COLORS: Record<
  string,
  { bg: string; text: string; activeBg: string; activeText: string }
> = {
  FW: { bg: 'bg-red-50', text: 'text-red-600', activeBg: 'bg-red-500', activeText: 'text-white' },
  MF: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    activeBg: 'bg-green-500',
    activeText: 'text-white',
  },
  DF: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    activeBg: 'bg-blue-500',
    activeText: 'text-white',
  },
  GK: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    activeBg: 'bg-yellow-500',
    activeText: 'text-white',
  },
};

/* ── 필터 바텀시트 ── */
function FilterSheet<T extends { id: number | string; label: string; logo?: string | null }>({
  visible,
  title,
  items,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  items: T[];
  selected: number | string | null;
  onSelect: (id: number | string | null) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/30" onPress={onClose} />
      <View className="rounded-t-3xl bg-white pb-8">
        <View className="flex-row items-center justify-between border-b border-neutral-100 px-5 py-4">
          <Text className="text-base font-bold text-neutral-900">{title}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <X size={20} color="#a3a3a3" />
          </Pressable>
        </View>
        <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
          {/* 전체 옵션 */}
          <Pressable
            className={`flex-row items-center px-5 py-3 ${selected == null ? 'bg-primary/5' : ''}`}
            onPress={() => {
              onSelect(null);
              onClose();
            }}
          >
            <Text
              className={`text-sm font-medium ${selected == null ? 'text-primary font-bold' : 'text-neutral-700'}`}
            >
              전체
            </Text>
          </Pressable>
          {items.map((item) => {
            const isActive = selected === item.id;
            return (
              <Pressable
                key={item.id}
                className={`flex-row items-center px-5 py-3 ${isActive ? 'bg-primary/5' : ''}`}
                onPress={() => {
                  onSelect(item.id);
                  onClose();
                }}
              >
                {item.logo !== undefined && (
                  <TeamLogo uri={item.logo} size={24} teamName={item.label} />
                )}
                <Text
                  className={`text-sm font-medium ${item.logo !== undefined ? 'ml-2.5' : ''} ${isActive ? 'text-primary font-bold' : 'text-neutral-700'}`}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

function FilterChip({
  label,
  active,
  onPress,
  onClear,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  onClear?: () => void;
}) {
  return (
    <Pressable
      className={`flex-row items-center rounded-full px-3 py-1.5 ${active ? 'bg-primary/10' : 'border border-neutral-200 bg-white'}`}
      onPress={onPress}
    >
      <Text className={`text-xs font-semibold ${active ? 'text-primary' : 'text-neutral-500'}`}>
        {label}
      </Text>
      {active && onClear ? (
        <Pressable onPress={onClear} hitSlop={8} className="ml-1">
          <X size={12} color="#ff4800" />
        </Pressable>
      ) : (
        <ChevronDown size={12} color={active ? '#ff4800' : '#a3a3a3'} style={{ marginLeft: 2 }} />
      )}
    </Pressable>
  );
}

/* ── 컴포넌트들 ── */
function PositionBadge({ position }: { position: string | null }) {
  if (!position) return null;
  const colors = POSITION_COLORS[position] ?? { bg: 'bg-neutral-100', text: 'text-neutral-500' };
  return (
    <View className={`rounded-full px-2 py-0.5 ${colors.bg}`}>
      <Text className={`text-[10px] font-bold ${colors.text}`}>{position}</Text>
    </View>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <View className="items-center">
      <Text className="text-[13px] font-bold text-neutral-800" style={NUM}>
        {value}
      </Text>
      <Text className="mt-0.5 text-[10px] font-medium text-neutral-400">{label}</Text>
    </View>
  );
}

function SeasonBadges({
  seasons,
}: {
  seasons: Array<{ season_name: string | null; year: number | null }>;
}) {
  if (!seasons || seasons.length === 0) return null;

  const maxShow = 3;
  const visible = seasons.slice(0, maxShow);
  const remaining = seasons.length - maxShow;

  return (
    <View className="mt-2.5 flex-row flex-wrap" style={{ gap: 4 }}>
      {visible.map((s, i) => (
        <View key={i} className="rounded-md bg-neutral-100 px-1.5 py-0.5">
          <Text className="text-[10px] font-medium text-neutral-500">
            {sanitizeLabel(s.season_name) || `${s.year}`}
          </Text>
        </View>
      ))}
      {remaining > 0 && (
        <View className="rounded-md bg-neutral-50 px-1.5 py-0.5">
          <Text className="text-[10px] font-medium text-neutral-400">+{remaining}</Text>
        </View>
      )}
    </View>
  );
}

function PlayerCard({ player }: { player: PlayersPageItem }) {
  const router = useRouter();
  const isGK = player.position === 'GK';

  return (
    <PressableCard
      className="mx-4 mb-3"
      onPress={() => router.push(`/players/${player.player_id}`)}
    >
      <View className="flex-row">
        {player.profile_image_url ? (
          <Image
            source={{ uri: player.profile_image_url }}
            style={{ width: 56, height: 56, borderRadius: 28 }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View className="h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
            <Text className="text-xl font-bold text-neutral-300">{player.name?.charAt(0)}</Text>
          </View>
        )}

        <View className="ml-3 flex-1">
          <View className="flex-row items-center" style={{ gap: 6 }}>
            <Text className="text-[15px] font-bold text-neutral-900">{player.name}</Text>
            {player.jersey_number != null && (
              <Text className="text-xs font-medium text-neutral-300">#{player.jersey_number}</Text>
            )}
            <PositionBadge position={player.position} />
          </View>

          {player.team && (
            <View className="mt-1 flex-row items-center" style={{ gap: 5 }}>
              <TeamLogo uri={player.team.logo} size={16} teamName={player.team.team_name} />
              <Text className="text-xs text-neutral-500">{player.team.team_name}</Text>
            </View>
          )}

          <View className="mt-2.5 flex-row" style={{ gap: 20 }}>
            <StatItem label="출전" value={player.totals.appearances} />
            <StatItem label="골" value={player.totals.goals} />
            {isGK ? (
              <StatItem label="실점" value={player.totals.goals_conceded} />
            ) : (
              <StatItem label="도움" value={player.totals.assists} />
            )}
          </View>

          <SeasonBadges seasons={player.seasons} />
        </View>
      </View>
    </PressableCard>
  );
}

/* ── 메인 화면 ── */
export default function PlayersScreen() {
  const [position, setPosition] = useState('');
  const [searchName, setSearchName] = useState('');
  const [submittedName, setSubmittedName] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [teamSheetOpen, setTeamSheetOpen] = useState(false);
  const [seasonSheetOpen, setSeasonSheetOpen] = useState(false);

  // 팀·시즌 목록
  const { data: teams } = useQuery({
    queryKey: ['teamsAll'],
    queryFn: getTeamsPrisma,
    staleTime: 1000 * 60 * 10,
  });

  const { data: seasons } = useQuery({
    queryKey: ['allSeasons'],
    queryFn: getAllSeasonsPrisma,
    staleTime: 1000 * 60 * 10,
  });

  const teamItems = (teams ?? []).map((t) => ({
    id: t.team_id,
    label: t.team_name,
    logo: t.logo ?? null,
  }));

  const seasonItems = (seasons ?? []).map((s) => ({
    id: s.season_id,
    label: sanitizeLabel(s.season_name) || `시즌 ${s.season_id}`,
  }));

  const selectedTeamName = teamItems.find((t) => t.id === selectedTeamId)?.label;
  const selectedSeasonName = seasonItems.find((s) => s.id === selectedSeasonId)?.label;

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['playersPage', position, submittedName, selectedTeamId, selectedSeasonId],
      queryFn: ({ pageParam }) =>
        getPlayersPagePrisma(pageParam as number, 15, {
          position: position || undefined,
          name: submittedName || undefined,
          teamId: selectedTeamId ?? undefined,
          seasonId: selectedSeasonId ?? undefined,
          order: 'apps',
        }),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextPage,
    });

  const handleSearch = useCallback(() => {
    setSubmittedName(searchName);
  }, [searchName]);

  const players = data?.pages.flatMap((p) => p.items) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  const hasFilters =
    !!position || !!submittedName || selectedTeamId != null || selectedSeasonId != null;

  const clearAllFilters = useCallback(() => {
    setPosition('');
    setSearchName('');
    setSubmittedName('');
    setSelectedTeamId(null);
    setSelectedSeasonId(null);
  }, []);

  return (
    <View className="flex-1 bg-neutral-50">
      {/* 검색 + 필터 (항상 표시) */}
      <View className="border-b border-neutral-100 bg-white px-4 pb-3 pt-2">
        {/* 검색 */}
        <View className="mb-3 flex-row items-center rounded-xl bg-neutral-50 px-3">
          <Search size={16} color="#a3a3a3" />
          <TextInput
            className="ml-2 h-10 flex-1 text-sm text-neutral-900"
            placeholder="선수 이름 검색"
            placeholderTextColor="#a3a3a3"
            value={searchName}
            onChangeText={setSearchName}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>

        {/* 포지션 필터 */}
        <View className="flex-row" style={{ gap: 8 }}>
          {POSITIONS.map((p) => {
            const isActive = position === p.key;
            const colors = p.key ? POSITION_COLORS[p.key] : null;
            const activeBg = colors ? colors.activeBg : 'bg-primary';
            const activeText = colors ? colors.activeText : 'text-white';

            return (
              <Pressable
                key={p.key}
                className={`rounded-full px-3.5 py-1.5 ${isActive ? activeBg : 'bg-neutral-100'}`}
                onPress={() => setPosition(p.key)}
              >
                <Text
                  className={`text-xs font-semibold ${isActive ? activeText : 'text-neutral-500'}`}
                >
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 팀·시즌 필터 */}
        <View className="mt-2.5 flex-row" style={{ gap: 8 }}>
          <FilterChip
            label={selectedTeamName ?? '팀'}
            active={selectedTeamId != null}
            onPress={() => setTeamSheetOpen(true)}
            onClear={selectedTeamId != null ? () => setSelectedTeamId(null) : undefined}
          />
          <FilterChip
            label={selectedSeasonName ?? '시즌'}
            active={selectedSeasonId != null}
            onPress={() => setSeasonSheetOpen(true)}
            onClear={selectedSeasonId != null ? () => setSelectedSeasonId(null) : undefined}
          />
        </View>
      </View>

      {/* 선수 목록 */}
      {isLoading ? (
        <LoadingSpinner />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <FlatList
          data={players}
          keyExtractor={(item) => String(item.player_id)}
          renderItem={({ item }) => <PlayerCard player={item} />}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            totalCount > 0 ? (
              <View className="mb-2 flex-row items-center px-4">
                <View className="mr-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                <Text className="text-xs font-semibold text-neutral-500">총 {totalCount}명</Text>
              </View>
            ) : null
          }
          ListFooterComponent={isFetchingNextPage ? <LoadingSpinner size="small" /> : null}
          ListEmptyComponent={
            <View className="items-center px-8 py-20">
              <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
                <SearchX size={28} color="#a3a3a3" />
              </View>
              <Text className="text-center text-base font-semibold text-neutral-700">
                {submittedName
                  ? `"${submittedName}" 검색 결과가 없습니다`
                  : '조건에 맞는 선수가 없습니다'}
              </Text>
              <Text className="mt-1.5 text-center text-sm text-neutral-400">
                {submittedName
                  ? '다른 이름으로 검색하거나 필터를 변경해 보세요'
                  : '필터 조건을 변경해 보세요'}
              </Text>
              {hasFilters && (
                <Pressable
                  className="mt-4 rounded-full bg-neutral-100 px-5 py-2"
                  onPress={clearAllFilters}
                >
                  <Text className="text-sm font-semibold text-neutral-600">필터 초기화</Text>
                </Pressable>
              )}
            </View>
          }
        />
      )}

      {/* 바텀시트 */}
      <FilterSheet
        visible={teamSheetOpen}
        title="팀 선택"
        items={teamItems}
        selected={selectedTeamId}
        onSelect={(id) => setSelectedTeamId(id as number | null)}
        onClose={() => setTeamSheetOpen(false)}
      />
      <FilterSheet
        visible={seasonSheetOpen}
        title="시즌 선택"
        items={seasonItems}
        selected={selectedSeasonId}
        onSelect={(id) => setSelectedSeasonId(id as number | null)}
        onClose={() => setSeasonSheetOpen(false)}
      />
    </View>
  );
}
