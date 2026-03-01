import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { PressableCard } from '@/components/ui/Card';
import { H2 } from '@/components/ui/Typography';

const STAT_PAGES = [
  { title: '득점 랭킹', description: '시즌별 득점 순위', path: '/stats/scoring' },
  { title: '골키퍼 랭킹', description: '시즌별 골키퍼 성적', path: '/stats/goalkeepers' },
  { title: '팀 랭킹', description: '시즌별 팀 순위', path: '/stats/team-rankings' },
  { title: '상대전적', description: '팀 간 상대전적', path: '/stats/head-to-head' },
  { title: '선수 vs 팀', description: '상대팀별 선수 성적', path: '/stats/player-vs-team' },
  { title: '선발 승률', description: '선발 출전 시 승률', path: '/stats/starter-win-rate' },
  { title: '승부차기', description: '승부차기 기록', path: '/stats/penalty-shootout' },
];

export default function StatsScreen() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="p-4">
        <H2>통계</H2>
      </View>
      <View className="gap-2 px-4 pb-8">
        {STAT_PAGES.map((page) => (
          <PressableCard key={page.path} onPress={() => router.push(page.path as never)}>
            <Text className="text-base font-semibold text-neutral-900">{page.title}</Text>
            <Text className="mt-1 text-sm text-neutral-500">{page.description}</Text>
          </PressableCard>
        ))}
      </View>
    </ScrollView>
  );
}
