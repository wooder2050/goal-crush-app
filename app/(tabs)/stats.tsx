import { useRouter } from 'expo-router';
import {
  Award,
  ChevronRight,
  Goal,
  Repeat2,
  Shield,
  Swords,
  Target,
  Users,
} from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';

import { PressableCard } from '@/components/ui/Card';

const STAT_PAGES = [
  {
    title: '득점 랭킹',
    description: '시즌별 득점 순위',
    path: '/stats/scoring',
    icon: <Goal size={20} color="#ff4800" />,
  },
  {
    title: '골키퍼 랭킹',
    description: '시즌별 골키퍼 성적',
    path: '/stats/goalkeepers',
    icon: <Shield size={20} color="#3b82f6" />,
  },
  {
    title: '팀 랭킹',
    description: '시즌별 팀 순위',
    path: '/stats/team-rankings',
    icon: <Users size={20} color="#8b5cf6" />,
  },
  {
    title: '상대전적',
    description: '팀 간 상대전적',
    path: '/stats/head-to-head',
    icon: <Swords size={20} color="#f59e0b" />,
  },
  {
    title: '선수 vs 팀',
    description: '상대팀별 선수 성적',
    path: '/stats/player-vs-team',
    icon: <Target size={20} color="#22c55e" />,
  },
  {
    title: '선발 승률',
    description: '선발 출전 시 승률',
    path: '/stats/starter-win-rate',
    icon: <Award size={20} color="#ec4899" />,
  },
  {
    title: '승부차기',
    description: '승부차기 기록',
    path: '/stats/penalty-shootout',
    icon: <Repeat2 size={20} color="#14b8a6" />,
  },
];

export default function StatsScreen() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-neutral-50" showsVerticalScrollIndicator={false}>
      <View className="gap-3 px-5 pb-10 pt-4">
        {STAT_PAGES.map((page) => (
          <PressableCard key={page.path} onPress={() => router.push(page.path as never)}>
            <View className="flex-row items-center">
              <View className="mr-3.5 h-10 w-10 items-center justify-center rounded-xl bg-neutral-50">
                {page.icon}
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-neutral-900">{page.title}</Text>
                <Text className="mt-0.5 text-xs text-neutral-400">{page.description}</Text>
              </View>
              <ChevronRight size={16} color="#d4d4d4" />
            </View>
          </PressableCard>
        ))}
      </View>
    </ScrollView>
  );
}
