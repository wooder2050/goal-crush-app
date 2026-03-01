import { Tabs } from 'expo-router';
import {
  Home,
  Calendar,
  Users,
  BarChart3,
  Menu,
} from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#ff4800',
        tabBarInactiveTintColor: '#a3a3a3',
        tabBarStyle: {
          borderTopColor: '#e5e5e5',
        },
        headerTitleStyle: {
          fontFamily: 'Inter_600SemiBold',
          fontSize: 18,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="seasons"
        options={{
          title: '시즌',
          tabBarIcon: ({ color, size }) => (
            <Calendar size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="players"
        options={{
          title: '선수',
          tabBarIcon: ({ color, size }) => (
            <Users size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: '통계',
          tabBarIcon: ({ color, size }) => (
            <BarChart3 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: '더보기',
          tabBarIcon: ({ color, size }) => (
            <Menu size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
