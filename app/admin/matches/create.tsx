import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Redirect, Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput } from 'react-native';

import { createAdminMatch } from '@/api/admin';
import { getAllSeasonsPrisma } from '@/api/seasons';
import { getTeamsPrisma } from '@/api/teams';
import { useAuth } from '@/components/AuthProvider';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function CreateMatchScreen() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  if (authLoading) return <LoadingSpinner />;
  if (!isAdmin) return <Redirect href="/" />;

  const { data: seasons } = useQuery({
    queryKey: ['allSeasons'],
    queryFn: getAllSeasonsPrisma,
  });
  const { data: teams } = useQuery({
    queryKey: ['teamsAll'],
    queryFn: getTeamsPrisma,
  });

  const [seasonId, setSeasonId] = useState('');
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const mutation = useMutation({
    mutationFn: createAdminMatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMatches'] });
      Alert.alert('성공', '경기가 생성되었습니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    },
    onError: (err: Error) => {
      Alert.alert('오류', err.message);
    },
  });

  const handleSubmit = () => {
    if (!seasonId || !homeTeamId || !awayTeamId || !matchDate) {
      Alert.alert('입력 오류', '시즌, 홈팀, 원정팀, 날짜는 필수입니다.');
      return;
    }
    mutation.mutate({
      season_id: Number(seasonId),
      home_team_id: Number(homeTeamId),
      away_team_id: Number(awayTeamId),
      match_date: matchDate,
      location: location || null,
      description: description || null,
      status: 'scheduled',
    });
  };

  return (
    <>
      <Stack.Screen options={{ title: '경기 생성', headerShown: true }} />
      <ScrollView className="flex-1 bg-neutral-50" contentContainerStyle={{ padding: 16 }}>
        <Card className="mb-4">
          <Text className="mb-1 text-sm font-medium text-neutral-700">시즌 ID</Text>
          <TextInput
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
            value={seasonId}
            onChangeText={setSeasonId}
            placeholder="시즌 ID 입력"
            keyboardType="number-pad"
          />
          {seasons && seasons.length > 0 && (
            <Text className="mt-1 text-xs text-neutral-400">
              최근:{' '}
              {seasons
                .slice(0, 3)
                .map((s) => `${s.season_name}(${s.season_id})`)
                .join(', ')}
            </Text>
          )}
        </Card>

        <Card className="mb-4">
          <Text className="mb-1 text-sm font-medium text-neutral-700">홈팀 ID</Text>
          <TextInput
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
            value={homeTeamId}
            onChangeText={setHomeTeamId}
            placeholder="홈팀 ID 입력"
            keyboardType="number-pad"
          />
        </Card>

        <Card className="mb-4">
          <Text className="mb-1 text-sm font-medium text-neutral-700">원정팀 ID</Text>
          <TextInput
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
            value={awayTeamId}
            onChangeText={setAwayTeamId}
            placeholder="원정팀 ID 입력"
            keyboardType="number-pad"
          />
          {teams && teams.length > 0 && (
            <Text className="mt-1 text-xs text-neutral-400">
              팀:{' '}
              {teams
                .slice(0, 5)
                .map((t) => `${t.team_name}(${t.team_id})`)
                .join(', ')}
            </Text>
          )}
        </Card>

        <Card className="mb-4">
          <Text className="mb-1 text-sm font-medium text-neutral-700">경기 일시</Text>
          <TextInput
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
            value={matchDate}
            onChangeText={setMatchDate}
            placeholder="YYYY-MM-DDTHH:mm:ss"
          />
        </Card>

        <Card className="mb-4">
          <Text className="mb-1 text-sm font-medium text-neutral-700">장소 (선택)</Text>
          <TextInput
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
            value={location}
            onChangeText={setLocation}
            placeholder="경기 장소"
          />
        </Card>

        <Card className="mb-4">
          <Text className="mb-1 text-sm font-medium text-neutral-700">설명 (선택)</Text>
          <TextInput
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
            value={description}
            onChangeText={setDescription}
            placeholder="경기 설명"
            multiline
          />
        </Card>

        <Button onPress={handleSubmit} disabled={mutation.isPending}>
          {mutation.isPending ? '생성 중...' : '경기 생성'}
        </Button>
      </ScrollView>
    </>
  );
}
