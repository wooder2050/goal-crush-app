import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Users,
  UserCog,
  Star,
  Trophy,
  MessageSquare,
  Heart,
  User,
  Shield,
  ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '@/components/AuthProvider';

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
}

const menuItems: MenuItem[] = [
  {
    label: '팀',
    icon: <Users size={20} color="#525252" />,
    href: '/teams',
  },
  {
    label: '코치',
    icon: <UserCog size={20} color="#525252" />,
    href: '/coaches',
  },
  {
    label: '평점',
    icon: <Star size={20} color="#525252" />,
    href: '/ratings',
  },
  {
    label: '판타지',
    icon: <Trophy size={20} color="#525252" />,
    href: '/fantasy',
  },
  {
    label: '커뮤니티',
    icon: <MessageSquare size={20} color="#525252" />,
    href: '/community',
  },
  {
    label: '응원',
    icon: <Heart size={20} color="#525252" />,
    href: '/supports',
    requiresAuth: true,
  },
  {
    label: '프로필',
    icon: <User size={20} color="#525252" />,
    href: '/profile',
    requiresAuth: true,
  },
  {
    label: '관리자',
    icon: <Shield size={20} color="#525252" />,
    href: '/admin',
    requiresAdmin: true,
  },
];

export default function MoreScreen() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();

  const handlePress = (item: MenuItem) => {
    if ((item.requiresAuth || item.requiresAdmin) && !user) {
      router.push('/auth/sign-in');
      return;
    }
    router.push(item.href as never);
  };

  const visibleItems = menuItems.filter((item) => {
    if (item.requiresAdmin && !isAdmin) return false;
    return true;
  });

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="py-2">
        {visibleItems.map((item) => (
          <Pressable
            key={item.href}
            className="flex-row items-center px-4 py-4 active:bg-neutral-50"
            onPress={() => handlePress(item)}
          >
            {item.icon}
            <Text className="ml-3 flex-1 text-base text-neutral-800">
              {item.label}
            </Text>
            <ChevronRight size={18} color="#a3a3a3" />
          </Pressable>
        ))}
      </View>

      {!user && (
        <View className="mx-4 mt-4 rounded-lg bg-neutral-50 p-4">
          <Text className="text-sm text-neutral-500">
            로그인하면 더 많은 기능을 이용할 수 있습니다.
          </Text>
          <Pressable
            className="mt-3 items-center rounded-lg bg-primary py-3"
            onPress={() => router.push('/auth/sign-in')}
          >
            <Text className="text-sm font-semibold text-white">
              로그인
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}
