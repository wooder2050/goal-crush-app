import { useRouter } from 'expo-router';
import { ChevronRight, UserCog, Users } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';

interface MenuItem {
  label: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  href: string;
}

const menuItems: MenuItem[] = [
  {
    label: '팀',
    description: '팀 목록 및 상세 정보',
    icon: <Users size={18} color="#8b5cf6" />,
    iconBg: 'bg-purple-50',
    href: '/teams',
  },
  {
    label: '감독',
    description: '감독 프로필 및 전적',
    icon: <UserCog size={18} color="#3b82f6" />,
    iconBg: 'bg-blue-50',
    href: '/coaches',
  },
];

export default function MoreScreen() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-neutral-50" showsVerticalScrollIndicator={false}>
      <View className="gap-2 px-5 pb-10 pt-4">
        {menuItems.map((item) => (
          <Pressable
            key={item.href}
            className="flex-row items-center rounded-2xl border border-neutral-100 bg-white p-4 active:bg-neutral-50/80"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 2,
            }}
            onPress={() => router.push(item.href as never)}
          >
            <View className={`h-10 w-10 items-center justify-center rounded-xl ${item.iconBg}`}>
              {item.icon}
            </View>
            <View className="ml-3.5 flex-1">
              <Text className="text-base font-semibold text-neutral-900">{item.label}</Text>
              <Text className="mt-0.5 text-xs text-neutral-400">{item.description}</Text>
            </View>
            <ChevronRight size={16} color="#d4d4d4" />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
