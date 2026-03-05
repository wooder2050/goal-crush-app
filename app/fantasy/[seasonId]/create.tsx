import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';

import { AvailablePlayer, createFantasyTeam, getAvailablePlayers } from '@/api/fantasy';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';

const MAX_PLAYERS = 5;
const MAX_SAME_TEAM = 2;

export default function CreateFantasyTeamScreen() {
  const { seasonId } = useLocalSearchParams<{ seasonId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = Number(seasonId);

  const [teamName, setTeamName] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<
    Array<{ player_id: number; position: string; name: string; team_id: number }>
  >([]);
  const [positionFilter, setPositionFilter] = useState('');

  const {
    data: players,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['availablePlayers', id],
    queryFn: () => getAvailablePlayers(id),
  });

  const mutation = useMutation({
    mutationFn: () =>
      createFantasyTeam({
        fantasy_season_id: id,
        team_name: teamName || undefined,
        players: selectedPlayers.map((p) => ({
          player_id: p.player_id,
          position: p.position,
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myFantasyTeams'] });
      queryClient.invalidateQueries({ queryKey: ['fantasyRankings'] });
      Alert.alert('완료', '팀이 생성되었습니다.', [{ text: '확인', onPress: () => router.back() }]);
    },
    onError: () => Alert.alert('오류', '팀 생성에 실패했습니다.'),
  });

  const togglePlayer = useCallback(
    (player: AvailablePlayer) => {
      const exists = selectedPlayers.find((p) => p.player_id === player.player_id);
      if (exists) {
        setSelectedPlayers((prev) => prev.filter((p) => p.player_id !== player.player_id));
        return;
      }
      if (selectedPlayers.length >= MAX_PLAYERS) {
        Alert.alert('알림', `최대 ${MAX_PLAYERS}명까지 선택 가능합니다.`);
        return;
      }
      const sameTeamCount = selectedPlayers.filter((p) => p.team_id === player.team_id).length;
      if (sameTeamCount >= MAX_SAME_TEAM) {
        Alert.alert('알림', `같은 팀에서 최대 ${MAX_SAME_TEAM}명까지 선택 가능합니다.`);
        return;
      }
      setSelectedPlayers((prev) => [
        ...prev,
        {
          player_id: player.player_id,
          position: player.position,
          name: player.name,
          team_id: player.team_id,
        },
      ]);
    },
    [selectedPlayers]
  );

  const handleSubmit = useCallback(() => {
    if (selectedPlayers.length !== MAX_PLAYERS) {
      Alert.alert('알림', `${MAX_PLAYERS}명의 선수를 선택하세요.`);
      return;
    }
    mutation.mutate();
  }, [selectedPlayers, mutation]);

  const filteredPlayers = positionFilter
    ? players?.filter((p) => p.position === positionFilter)
    : players;

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <>
      <Stack.Screen
        options={{
          title: '팀 만들기',
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
        }}
      />
      <View className="flex-1 bg-neutral-50">
        <View className="border-b border-neutral-100 bg-white px-5 py-3.5">
          <TextInput
            className="mb-2.5 h-10 rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 text-sm text-neutral-900"
            placeholder="팀 이름 (선택)"
            placeholderTextColor="#b5b5b5"
            value={teamName}
            onChangeText={setTeamName}
          />
          <Text className="mb-2 text-xs font-semibold text-neutral-500">
            선택: {selectedPlayers.length}/{MAX_PLAYERS}명
          </Text>
          <View className="flex-row flex-wrap gap-1.5">
            {selectedPlayers.map((p) => (
              <Badge key={p.player_id} variant="primary">
                {p.name}
              </Badge>
            ))}
          </View>
          <View className="mt-3 flex-row gap-2">
            {['', 'GK', 'DF', 'MF', 'FW'].map((pos) => (
              <Pressable
                key={pos}
                className={`rounded-full px-4 py-1.5 ${positionFilter === pos ? 'bg-primary' : 'border border-neutral-200 bg-neutral-50'}`}
                onPress={() => setPositionFilter(pos)}
              >
                <Text
                  className={`text-xs font-semibold ${positionFilter === pos ? 'text-white' : 'text-neutral-600'}`}
                >
                  {pos || '전체'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <FlatList
          data={filteredPlayers}
          keyExtractor={(item) => String(item.player_id)}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isSelected = selectedPlayers.some((p) => p.player_id === item.player_id);
            return (
              <Pressable
                className={`flex-row items-center border-b border-neutral-100 px-5 py-3.5 ${isSelected ? 'bg-primary/5' : 'bg-white'}`}
                onPress={() => togglePlayer(item)}
              >
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm font-bold text-neutral-900">{item.name}</Text>
                    <Badge variant="outline">{item.position}</Badge>
                  </View>
                  <Text className="mt-0.5 text-xs text-neutral-400">{item.team_name}</Text>
                </View>
                {isSelected && (
                  <View className="h-6 w-6 items-center justify-center rounded-full bg-primary">
                    <Check size={14} color="#fff" strokeWidth={3} />
                  </View>
                )}
              </Pressable>
            );
          }}
          contentContainerStyle={{ paddingBottom: 100 }}
        />

        <View className="absolute bottom-0 left-0 right-0 border-t border-neutral-100 bg-white px-5 pb-8 pt-3">
          <Pressable
            className={`rounded-xl py-3.5 ${selectedPlayers.length === MAX_PLAYERS ? 'bg-primary' : 'bg-neutral-200'}`}
            onPress={handleSubmit}
            disabled={mutation.isPending || selectedPlayers.length !== MAX_PLAYERS}
          >
            <Text
              className={`text-center text-sm font-bold ${selectedPlayers.length === MAX_PLAYERS ? 'text-white' : 'text-neutral-400'}`}
            >
              {mutation.isPending
                ? '생성 중...'
                : `팀 생성 (${selectedPlayers.length}/${MAX_PLAYERS})`}
            </Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}
