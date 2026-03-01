import { useQuery } from '@tanstack/react-query';
import { Pressable, ScrollView, Text } from 'react-native';

import { getAllSeasonsPrisma, SeasonWithStats } from '@/api/seasons';

interface SeasonSelectProps {
  selectedSeasonId: number | null;
  onSelect: (seasonId: number | null) => void;
}

export function SeasonSelect({ selectedSeasonId, onSelect }: SeasonSelectProps) {
  const { data: seasons } = useQuery({
    queryKey: ['allSeasons'],
    queryFn: getAllSeasonsPrisma,
  });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}
      className="max-h-10 border-b border-neutral-200 bg-white py-1.5"
    >
      <Pressable
        className={`rounded-full px-3 py-1 ${selectedSeasonId === null ? 'bg-primary' : 'bg-neutral-100'}`}
        onPress={() => onSelect(null)}
      >
        <Text
          className={`text-xs font-medium ${selectedSeasonId === null ? 'text-white' : 'text-neutral-600'}`}
        >
          전체
        </Text>
      </Pressable>
      {seasons?.map((s: SeasonWithStats) => (
        <Pressable
          key={s.season_id}
          className={`rounded-full px-3 py-1 ${selectedSeasonId === s.season_id ? 'bg-primary' : 'bg-neutral-100'}`}
          onPress={() => onSelect(s.season_id)}
        >
          <Text
            className={`text-xs font-medium ${selectedSeasonId === s.season_id ? 'text-white' : 'text-neutral-600'}`}
          >
            {s.season_name}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
