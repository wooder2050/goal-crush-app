import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { ChevronDown, Search, X } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { getPlayersPagePrisma } from '@/api/players';
import { getAllSeasonsPrisma } from '@/api/seasons';
import { getPlayerVsTeam } from '@/api/stats';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TeamLogo } from '@/components/TeamLogo';
import type { TeamRecord } from '@/features/stats/types/player-vs-team';
import { sanitizeLabel } from '@/lib/utils';

const NUM = { fontVariant: ['tabular-nums' as const] };

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
      className={`flex-row items-center rounded-full px-3 py-1.5 ${active ? 'bg-emerald-500/10' : 'bg-neutral-100'}`}
      onPress={onPress}
    >
      <Text className={`text-xs font-semibold ${active ? 'text-emerald-600' : 'text-neutral-500'}`}>
        {label}
      </Text>
      <ChevronDown size={12} color={active ? '#059669' : '#a3a3a3'} style={{ marginLeft: 2 }} />
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
              className={`rounded-xl px-4 py-3 ${selected === opt.value ? 'bg-emerald-500/10' : ''}`}
              onPress={() => {
                onSelect(opt.value);
                onClose();
              }}
            >
              <Text
                className={`text-sm ${selected === opt.value ? 'font-bold text-emerald-600' : 'text-neutral-700'}`}
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

/* ── 상대팀 기록 Row ── */
function RecordRow({ record }: { record: TeamRecord }) {
  const router = useRouter();
  return (
    <Pressable
      className="flex-row items-center px-4 py-3.5 active:bg-neutral-50"
      onPress={() => router.push(`/teams/${record.opponent_team_id}`)}
    >
      <TeamLogo uri={record.opponent_team_logo} size={32} teamName={record.opponent_team_name} />
      <View className="ml-3 flex-1">
        <Text className="text-sm font-semibold text-neutral-900">{record.opponent_team_name}</Text>
        <Text className="text-[11px] text-neutral-400">{record.matches_played}경기</Text>
      </View>
      <View className="items-end">
        <Text className="text-base font-bold text-neutral-900" style={NUM}>
          {record.attack_points}
        </Text>
        <Text className="text-[10px] text-neutral-400">
          {record.goals}골 {record.assists}도움
        </Text>
      </View>
    </Pressable>
  );
}

/* ── 메인 페이지 ── */
export default function PlayerVsTeamPage() {
  const [searchName, setSearchName] = useState('');
  const [submittedName, setSubmittedName] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [selectedPlayerName, setSelectedPlayerName] = useState('');
  const [seasonId, setSeasonId] = useState<number | null>(null);
  const [showSeasonSheet, setShowSeasonSheet] = useState(false);

  const { data: seasons } = useQuery({
    queryKey: ['allSeasons'],
    queryFn: getAllSeasonsPrisma,
    staleTime: 10 * 60 * 1000,
  });

  const seasonLabel = seasonId
    ? sanitizeLabel(seasons?.find((s) => s.season_id === seasonId)?.season_name) || '시즌'
    : '전체 시즌';

  const seasonOptions = [
    { value: 0 as number, label: '전체 시즌' },
    ...(seasons?.map((s) => ({ value: s.season_id, label: sanitizeLabel(s.season_name) })) ?? []),
  ];

  const { data: searchResults } = useQuery({
    queryKey: ['playerSearch', submittedName],
    queryFn: () => getPlayersPagePrisma(1, 10, { name: submittedName }),
    enabled: submittedName.length > 0,
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['playerVsTeam', selectedPlayerId, seasonId],
    queryFn: () => getPlayerVsTeam(selectedPlayerId!, seasonId ?? undefined),
    enabled: selectedPlayerId !== null,
  });

  const handleSearch = useCallback(() => {
    setSubmittedName(searchName.trim());
    setSelectedPlayerId(null);
  }, [searchName]);

  const showSearchResults = submittedName.length > 0 && selectedPlayerId === null;

  return (
    <>
      <Stack.Screen
        options={{
          title: '선수 vs 팀',
          headerShown: true,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <View className="flex-1 bg-neutral-50">
        {/* 검색 + 필터 */}
        <View className="bg-white px-4 pb-3 pt-2">
          <View
            className="flex-row items-center rounded-xl border border-neutral-200 bg-neutral-50 px-3"
            style={{ height: 40 }}
          >
            <Search size={16} color="#a3a3a3" />
            <TextInput
              className="ml-2 flex-1 text-sm text-neutral-900"
              placeholder="선수 이름 검색"
              placeholderTextColor="#a3a3a3"
              value={searchName}
              onChangeText={setSearchName}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchName.length > 0 && (
              <Pressable
                onPress={() => {
                  setSearchName('');
                  setSubmittedName('');
                  setSelectedPlayerId(null);
                }}
                hitSlop={8}
              >
                <X size={16} color="#a3a3a3" />
              </Pressable>
            )}
          </View>

          {selectedPlayerId && (
            <View className="mt-2 flex-row" style={{ gap: 8 }}>
              <FilterChip
                label={seasonLabel}
                active={seasonId !== null}
                onPress={() => setShowSeasonSheet(true)}
              />
            </View>
          )}
        </View>

        {/* 검색 결과 */}
        {showSearchResults && searchResults && searchResults.items.length > 0 && (
          <View className="border-b border-neutral-100 bg-white">
            {searchResults.items.map((p) => (
              <Pressable
                key={p.player_id}
                className="flex-row items-center px-4 py-2.5 active:bg-neutral-50"
                onPress={() => {
                  setSelectedPlayerId(p.player_id);
                  setSelectedPlayerName(p.name ?? '');
                  setSearchName(p.name ?? '');
                }}
              >
                {p.profile_image_url ? (
                  <Image
                    source={{ uri: p.profile_image_url }}
                    style={{ width: 28, height: 28, borderRadius: 14 }}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View className="h-7 w-7 items-center justify-center rounded-full bg-neutral-100">
                    <Text className="text-xs font-bold text-neutral-400">{p.name?.charAt(0)}</Text>
                  </View>
                )}
                <Text className="ml-2 text-sm font-medium text-neutral-900">{p.name}</Text>
                {p.team && (
                  <Text className="ml-2 text-xs text-neutral-400">{p.team.team_name}</Text>
                )}
              </Pressable>
            ))}
          </View>
        )}

        {/* 선수 헤더 + 데이터 */}
        {selectedPlayerId ? (
          isLoading ? (
            <LoadingSpinner />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : data ? (
            <FlatList
              data={data.team_records}
              keyExtractor={(item) => String(item.opponent_team_id)}
              renderItem={({ item }) => <RecordRow record={item} />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 32 }}
              ListHeaderComponent={
                <View className="px-4 pb-1 pt-3">
                  <Text className="text-sm font-bold text-neutral-700">
                    {selectedPlayerName} - 상대팀별 성적
                  </Text>
                </View>
              }
              ListEmptyComponent={<EmptyState title="기록이 없습니다." />}
            />
          ) : null
        ) : !showSearchResults ? (
          <EmptyState title="선수를 검색하세요." />
        ) : null}
      </View>

      {/* 시즌 바텀시트 */}
      <FilterSheet
        visible={showSeasonSheet}
        onClose={() => setShowSeasonSheet(false)}
        title="시즌"
        options={seasonOptions}
        selected={seasonId ?? 0}
        onSelect={(v) => setSeasonId(v === 0 ? null : v)}
      />
    </>
  );
}
