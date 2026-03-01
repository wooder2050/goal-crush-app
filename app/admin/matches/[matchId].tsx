import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import {
  createAdminAssist,
  createAdminGoal,
  createAdminLineup,
  createAdminMatchCoach,
  createAdminPenalty,
  createAdminSubstitution,
  deleteAdminMatch,
  getAdminAssists,
  getAdminGoals,
  getAdminLineups,
  getAdminMatch,
  getAdminMatchCoaches,
  getAdminPenalties,
  getAdminSubstitutions,
  updateAdminMatch,
} from '@/api/admin';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type TabKey = 'score' | 'goals' | 'assists' | 'lineups' | 'substitutions' | 'penalties' | 'coaches';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'score', label: '스코어' },
  { key: 'goals', label: '골' },
  { key: 'assists', label: '어시스트' },
  { key: 'lineups', label: '라인업' },
  { key: 'substitutions', label: '교체' },
  { key: 'penalties', label: 'PK' },
  { key: 'coaches', label: '감독' },
];

export default function AdminMatchDetailScreen() {
  const { matchId: rawId } = useLocalSearchParams<{ matchId: string }>();
  const matchId = Number(rawId);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('score');

  const {
    data: match,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['adminMatch', matchId],
    queryFn: () => getAdminMatch(matchId),
    enabled: !isNaN(matchId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAdminMatch(matchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMatches'] });
      router.back();
    },
    onError: (err: Error) => Alert.alert('오류', err.message),
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError || !match) return <ErrorState onRetry={() => refetch()} />;

  return (
    <>
      <Stack.Screen
        options={{
          title: `${match.home_team.team_name} vs ${match.away_team.team_name}`,
          headerShown: true,
        }}
      />
      <View className="flex-1 bg-neutral-50">
        <Card className="mx-4 mt-3">
          <Text className="text-center text-sm text-neutral-500">
            {format(new Date(match.match_date), 'yyyy.MM.dd HH:mm')}
            {match.location ? ` · ${match.location}` : ''}
          </Text>
          <Text className="mt-1 text-center text-2xl font-bold text-neutral-900">
            {match.home_team.team_name} {match.home_score ?? '-'} : {match.away_score ?? '-'}{' '}
            {match.away_team.team_name}
          </Text>
          {match.penalty_home_score != null && (
            <Text className="text-center text-sm text-neutral-500">
              PK {match.penalty_home_score} : {match.penalty_away_score}
            </Text>
          )}
        </Card>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3 border-b border-neutral-200 bg-white"
          contentContainerStyle={{ paddingHorizontal: 12 }}
        >
          {TABS.map((t) => (
            <Pressable
              key={t.key}
              className={`mr-1 px-3 py-2 ${activeTab === t.key ? 'border-b-2 border-primary' : ''}`}
              onPress={() => setActiveTab(t.key)}
            >
              <Text
                className={`text-sm font-medium ${activeTab === t.key ? 'text-primary' : 'text-neutral-500'}`}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
          {activeTab === 'score' && <ScoreTab matchId={matchId} match={match} />}
          {activeTab === 'goals' && <GoalsTab matchId={matchId} />}
          {activeTab === 'assists' && <AssistsTab matchId={matchId} />}
          {activeTab === 'lineups' && <LineupsTab matchId={matchId} />}
          {activeTab === 'substitutions' && <SubstitutionsTab matchId={matchId} />}
          {activeTab === 'penalties' && <PenaltiesTab matchId={matchId} />}
          {activeTab === 'coaches' && <CoachesTab matchId={matchId} />}
        </ScrollView>

        <View className="border-t border-neutral-200 bg-white px-4 py-3">
          <Button
            variant="destructive"
            onPress={() =>
              Alert.alert('경기 삭제', '정말 삭제하시겠습니까?', [
                { text: '취소', style: 'cancel' },
                { text: '삭제', style: 'destructive', onPress: () => deleteMutation.mutate() },
              ])
            }
          >
            경기 삭제
          </Button>
        </View>
      </View>
    </>
  );
}

// --- Score Tab ---
function ScoreTab({
  matchId,
  match,
}: {
  matchId: number;
  match: { home_score: number | null; away_score: number | null; status: string };
}) {
  const queryClient = useQueryClient();
  const [homeScore, setHomeScore] = useState(String(match.home_score ?? ''));
  const [awayScore, setAwayScore] = useState(String(match.away_score ?? ''));
  const [status, setStatus] = useState(match.status);

  const mutation = useMutation({
    mutationFn: (data: { home_score?: number; away_score?: number; status?: string }) =>
      updateAdminMatch(matchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMatch', matchId] });
      Alert.alert('성공', '스코어가 업데이트되었습니다.');
    },
    onError: (err: Error) => Alert.alert('오류', err.message),
  });

  return (
    <View>
      <Text className="mb-2 text-sm font-semibold text-neutral-700">홈 스코어</Text>
      <TextInput
        className="mb-3 rounded-lg border border-neutral-300 bg-white px-3 py-2"
        value={homeScore}
        onChangeText={setHomeScore}
        keyboardType="number-pad"
      />
      <Text className="mb-2 text-sm font-semibold text-neutral-700">원정 스코어</Text>
      <TextInput
        className="mb-3 rounded-lg border border-neutral-300 bg-white px-3 py-2"
        value={awayScore}
        onChangeText={setAwayScore}
        keyboardType="number-pad"
      />
      <Text className="mb-2 text-sm font-semibold text-neutral-700">상태</Text>
      <View className="mb-4 flex-row gap-2">
        {['scheduled', 'completed', 'cancelled'].map((s) => (
          <Pressable
            key={s}
            className={`rounded-full px-3 py-1 ${status === s ? 'bg-primary' : 'bg-neutral-100'}`}
            onPress={() => setStatus(s)}
          >
            <Text className={`text-xs ${status === s ? 'text-white' : 'text-neutral-600'}`}>
              {s}
            </Text>
          </Pressable>
        ))}
      </View>
      <Button
        onPress={() =>
          mutation.mutate({
            home_score: homeScore ? Number(homeScore) : undefined,
            away_score: awayScore ? Number(awayScore) : undefined,
            status,
          })
        }
        disabled={mutation.isPending}
      >
        {mutation.isPending ? '저장 중...' : '스코어 저장'}
      </Button>
    </View>
  );
}

// --- Goals Tab ---
function GoalsTab({ matchId }: { matchId: number }) {
  const queryClient = useQueryClient();
  const { data: goals, isLoading } = useQuery({
    queryKey: ['adminGoals', matchId],
    queryFn: () => getAdminGoals(matchId),
  });

  const [playerId, setPlayerId] = useState('');
  const [goalTime, setGoalTime] = useState('');

  const mutation = useMutation({
    mutationFn: (data: { player_id: number; goal_time: number }) => createAdminGoal(matchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminGoals', matchId] });
      setPlayerId('');
      setGoalTime('');
    },
    onError: (err: Error) => Alert.alert('오류', err.message),
  });

  return (
    <View>
      {isLoading ? (
        <LoadingSpinner size="small" />
      ) : (
        goals?.map((g) => (
          <Card key={g.goal_id} className="mb-2">
            <Text className="text-sm text-neutral-900">
              {g.player?.name ?? `선수#${g.player_id}`} - {g.goal_time}분 ({g.goal_type})
            </Text>
          </Card>
        ))
      )}
      <View className="mt-4 rounded-lg border border-neutral-200 bg-white p-3">
        <Text className="mb-2 text-sm font-semibold text-neutral-700">골 추가</Text>
        <TextInput
          className="mb-2 rounded border border-neutral-300 px-3 py-2 text-sm"
          placeholder="선수 ID"
          value={playerId}
          onChangeText={setPlayerId}
          keyboardType="number-pad"
        />
        <TextInput
          className="mb-2 rounded border border-neutral-300 px-3 py-2 text-sm"
          placeholder="골 시간 (분)"
          value={goalTime}
          onChangeText={setGoalTime}
          keyboardType="number-pad"
        />
        <Button
          size="sm"
          onPress={() =>
            mutation.mutate({ player_id: Number(playerId), goal_time: Number(goalTime) })
          }
          disabled={mutation.isPending || !playerId || !goalTime}
        >
          추가
        </Button>
      </View>
    </View>
  );
}

// --- Assists Tab ---
function AssistsTab({ matchId }: { matchId: number }) {
  const queryClient = useQueryClient();
  const { data: assists, isLoading } = useQuery({
    queryKey: ['adminAssists', matchId],
    queryFn: () => getAdminAssists(matchId),
  });

  const [playerId, setPlayerId] = useState('');
  const [goalId, setGoalId] = useState('');

  const mutation = useMutation({
    mutationFn: (data: { player_id: number; goal_id: number }) => createAdminAssist(matchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAssists', matchId] });
      setPlayerId('');
      setGoalId('');
    },
    onError: (err: Error) => Alert.alert('오류', err.message),
  });

  return (
    <View>
      {isLoading ? (
        <LoadingSpinner size="small" />
      ) : (
        assists?.map((a) => (
          <Card key={a.assist_id} className="mb-2">
            <Text className="text-sm text-neutral-900">
              {a.player?.name ?? `선수#${a.player_id}`} → {a.goal?.player?.name ?? ''}(
              {a.goal?.goal_time}분)
            </Text>
          </Card>
        ))
      )}
      <View className="mt-4 rounded-lg border border-neutral-200 bg-white p-3">
        <Text className="mb-2 text-sm font-semibold text-neutral-700">어시스트 추가</Text>
        <TextInput
          className="mb-2 rounded border border-neutral-300 px-3 py-2 text-sm"
          placeholder="선수 ID"
          value={playerId}
          onChangeText={setPlayerId}
          keyboardType="number-pad"
        />
        <TextInput
          className="mb-2 rounded border border-neutral-300 px-3 py-2 text-sm"
          placeholder="골 ID"
          value={goalId}
          onChangeText={setGoalId}
          keyboardType="number-pad"
        />
        <Button
          size="sm"
          onPress={() => mutation.mutate({ player_id: Number(playerId), goal_id: Number(goalId) })}
          disabled={mutation.isPending || !playerId || !goalId}
        >
          추가
        </Button>
      </View>
    </View>
  );
}

// --- Lineups Tab ---
function LineupsTab({ matchId }: { matchId: number }) {
  const queryClient = useQueryClient();
  const { data: lineups, isLoading } = useQuery({
    queryKey: ['adminLineups', matchId],
    queryFn: () => getAdminLineups(matchId),
  });

  const [playerId, setPlayerId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [position, setPosition] = useState('');

  const mutation = useMutation({
    mutationFn: (data: { player_id: number; team_id: number; position: string }) =>
      createAdminLineup(matchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLineups', matchId] });
      setPlayerId('');
      setPosition('');
    },
    onError: (err: Error) => Alert.alert('오류', err.message),
  });

  return (
    <View>
      {isLoading ? (
        <LoadingSpinner size="small" />
      ) : (
        lineups?.map((l) => (
          <Card key={l.stat_id} className="mb-2">
            <Text className="text-sm text-neutral-900">
              [{l.team?.team_name}] {l.player?.name ?? `선수#${l.player_id}`} - {l.position} (
              {l.minutes_played}분)
            </Text>
          </Card>
        ))
      )}
      <View className="mt-4 rounded-lg border border-neutral-200 bg-white p-3">
        <Text className="mb-2 text-sm font-semibold text-neutral-700">라인업 추가</Text>
        <TextInput
          className="mb-2 rounded border border-neutral-300 px-3 py-2 text-sm"
          placeholder="선수 ID"
          value={playerId}
          onChangeText={setPlayerId}
          keyboardType="number-pad"
        />
        <TextInput
          className="mb-2 rounded border border-neutral-300 px-3 py-2 text-sm"
          placeholder="팀 ID"
          value={teamId}
          onChangeText={setTeamId}
          keyboardType="number-pad"
        />
        <TextInput
          className="mb-2 rounded border border-neutral-300 px-3 py-2 text-sm"
          placeholder="포지션 (GK, DF, MF, FW)"
          value={position}
          onChangeText={setPosition}
        />
        <Button
          size="sm"
          onPress={() =>
            mutation.mutate({
              player_id: Number(playerId),
              team_id: Number(teamId),
              position,
            })
          }
          disabled={mutation.isPending || !playerId || !teamId || !position}
        >
          추가
        </Button>
      </View>
    </View>
  );
}

// --- Substitutions Tab ---
function SubstitutionsTab({ matchId }: { matchId: number }) {
  const queryClient = useQueryClient();
  const { data: subs, isLoading } = useQuery({
    queryKey: ['adminSubstitutions', matchId],
    queryFn: () => getAdminSubstitutions(matchId),
  });

  const [teamId, setTeamId] = useState('');
  const [playerInId, setPlayerInId] = useState('');
  const [playerOutId, setPlayerOutId] = useState('');
  const [subTime, setSubTime] = useState('');

  const mutation = useMutation({
    mutationFn: (data: {
      team_id: number;
      player_in_id: number;
      player_out_id: number;
      substitution_time: number;
    }) => createAdminSubstitution(matchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSubstitutions', matchId] });
      setPlayerInId('');
      setPlayerOutId('');
      setSubTime('');
    },
    onError: (err: Error) => Alert.alert('오류', err.message),
  });

  return (
    <View>
      {isLoading ? (
        <LoadingSpinner size="small" />
      ) : (
        subs?.map((s) => (
          <Card key={s.substitution_id} className="mb-2">
            <Text className="text-sm text-neutral-900">
              [{s.team?.team_name}] {s.player_out?.name} → {s.player_in?.name} (
              {s.substitution_time}분)
            </Text>
          </Card>
        ))
      )}
      <View className="mt-4 rounded-lg border border-neutral-200 bg-white p-3">
        <Text className="mb-2 text-sm font-semibold text-neutral-700">교체 추가</Text>
        <TextInput
          className="mb-2 rounded border border-neutral-300 px-3 py-2 text-sm"
          placeholder="팀 ID"
          value={teamId}
          onChangeText={setTeamId}
          keyboardType="number-pad"
        />
        <TextInput
          className="mb-2 rounded border border-neutral-300 px-3 py-2 text-sm"
          placeholder="교체 투입 선수 ID"
          value={playerInId}
          onChangeText={setPlayerInId}
          keyboardType="number-pad"
        />
        <TextInput
          className="mb-2 rounded border border-neutral-300 px-3 py-2 text-sm"
          placeholder="교체 아웃 선수 ID"
          value={playerOutId}
          onChangeText={setPlayerOutId}
          keyboardType="number-pad"
        />
        <TextInput
          className="mb-2 rounded border border-neutral-300 px-3 py-2 text-sm"
          placeholder="교체 시간 (분)"
          value={subTime}
          onChangeText={setSubTime}
          keyboardType="number-pad"
        />
        <Button
          size="sm"
          onPress={() =>
            mutation.mutate({
              team_id: Number(teamId),
              player_in_id: Number(playerInId),
              player_out_id: Number(playerOutId),
              substitution_time: Number(subTime),
            })
          }
          disabled={mutation.isPending || !teamId || !playerInId || !playerOutId || !subTime}
        >
          추가
        </Button>
      </View>
    </View>
  );
}

// --- Penalties Tab ---
function PenaltiesTab({ matchId }: { matchId: number }) {
  const queryClient = useQueryClient();
  const { data: penalties, isLoading } = useQuery({
    queryKey: ['adminPenalties', matchId],
    queryFn: () => getAdminPenalties(matchId),
  });

  const [teamId, setTeamId] = useState('');
  const [kickerId, setKickerId] = useState('');
  const [goalkeeperId, setGoalkeeperId] = useState('');
  const [isScored, setIsScored] = useState(true);
  const [order, setOrder] = useState('');

  const mutation = useMutation({
    mutationFn: (data: {
      team_id: number;
      player_id: number;
      goalkeeper_id: number;
      is_scored: boolean;
      order: number;
    }) => createAdminPenalty(matchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPenalties', matchId] });
      setKickerId('');
      setGoalkeeperId('');
      setOrder('');
    },
    onError: (err: Error) => Alert.alert('오류', err.message),
  });

  return (
    <View>
      {isLoading ? (
        <LoadingSpinner size="small" />
      ) : (
        penalties?.map((p) => (
          <Card key={p.penalty_detail_id} className="mb-2">
            <Text className="text-sm text-neutral-900">
              #{p.kicker_order} [{p.team?.team_name}] {p.kicker?.name} →{' '}
              {p.is_successful ? '성공' : '실패'} (GK: {p.goalkeeper?.name})
            </Text>
          </Card>
        ))
      )}
      <View className="mt-4 rounded-lg border border-neutral-200 bg-white p-3">
        <Text className="mb-2 text-sm font-semibold text-neutral-700">PK 추가</Text>
        <TextInput
          className="mb-2 rounded border border-neutral-300 px-3 py-2 text-sm"
          placeholder="팀 ID"
          value={teamId}
          onChangeText={setTeamId}
          keyboardType="number-pad"
        />
        <TextInput
          className="mb-2 rounded border border-neutral-300 px-3 py-2 text-sm"
          placeholder="키커 선수 ID"
          value={kickerId}
          onChangeText={setKickerId}
          keyboardType="number-pad"
        />
        <TextInput
          className="mb-2 rounded border border-neutral-300 px-3 py-2 text-sm"
          placeholder="골키퍼 선수 ID"
          value={goalkeeperId}
          onChangeText={setGoalkeeperId}
          keyboardType="number-pad"
        />
        <TextInput
          className="mb-2 rounded border border-neutral-300 px-3 py-2 text-sm"
          placeholder="순서"
          value={order}
          onChangeText={setOrder}
          keyboardType="number-pad"
        />
        <View className="mb-2 flex-row gap-2">
          <Pressable
            className={`rounded-full px-3 py-1 ${isScored ? 'bg-green-500' : 'bg-neutral-100'}`}
            onPress={() => setIsScored(true)}
          >
            <Text className={`text-xs ${isScored ? 'text-white' : 'text-neutral-600'}`}>성공</Text>
          </Pressable>
          <Pressable
            className={`rounded-full px-3 py-1 ${!isScored ? 'bg-red-500' : 'bg-neutral-100'}`}
            onPress={() => setIsScored(false)}
          >
            <Text className={`text-xs ${!isScored ? 'text-white' : 'text-neutral-600'}`}>실패</Text>
          </Pressable>
        </View>
        <Button
          size="sm"
          onPress={() =>
            mutation.mutate({
              team_id: Number(teamId),
              player_id: Number(kickerId),
              goalkeeper_id: Number(goalkeeperId),
              is_scored: isScored,
              order: Number(order),
            })
          }
          disabled={mutation.isPending || !teamId || !kickerId || !goalkeeperId || !order}
        >
          추가
        </Button>
      </View>
    </View>
  );
}

// --- Coaches Tab ---
function CoachesTab({ matchId }: { matchId: number }) {
  const queryClient = useQueryClient();
  const { data: coaches, isLoading } = useQuery({
    queryKey: ['adminMatchCoaches', matchId],
    queryFn: () => getAdminMatchCoaches(matchId),
  });

  const [teamId, setTeamId] = useState('');
  const [coachId, setCoachId] = useState('');
  const [role, setRole] = useState('head');

  const createMutation = useMutation({
    mutationFn: (data: { team_id: number; coach_id: number; role: string }) =>
      createAdminMatchCoach(matchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMatchCoaches', matchId] });
      setCoachId('');
    },
    onError: (err: Error) => Alert.alert('오류', err.message),
  });

  return (
    <View>
      {isLoading ? (
        <LoadingSpinner size="small" />
      ) : (
        coaches?.map((c) => (
          <Card key={c.id} className="mb-2">
            <Text className="text-sm text-neutral-900">
              [{c.team_name}] {c.coach_name} - {c.role}
            </Text>
          </Card>
        ))
      )}
      <View className="mt-4 rounded-lg border border-neutral-200 bg-white p-3">
        <Text className="mb-2 text-sm font-semibold text-neutral-700">감독 추가</Text>
        <TextInput
          className="mb-2 rounded border border-neutral-300 px-3 py-2 text-sm"
          placeholder="팀 ID"
          value={teamId}
          onChangeText={setTeamId}
          keyboardType="number-pad"
        />
        <TextInput
          className="mb-2 rounded border border-neutral-300 px-3 py-2 text-sm"
          placeholder="코치 ID"
          value={coachId}
          onChangeText={setCoachId}
          keyboardType="number-pad"
        />
        <View className="mb-2 flex-row gap-2">
          {['head', 'assistant'].map((r) => (
            <Pressable
              key={r}
              className={`rounded-full px-3 py-1 ${role === r ? 'bg-primary' : 'bg-neutral-100'}`}
              onPress={() => setRole(r)}
            >
              <Text className={`text-xs ${role === r ? 'text-white' : 'text-neutral-600'}`}>
                {r === 'head' ? '감독' : '코치'}
              </Text>
            </Pressable>
          ))}
        </View>
        <Button
          size="sm"
          onPress={() =>
            createMutation.mutate({
              team_id: Number(teamId),
              coach_id: Number(coachId),
              role,
            })
          }
          disabled={createMutation.isPending || !teamId || !coachId}
        >
          추가
        </Button>
      </View>
    </View>
  );
}
