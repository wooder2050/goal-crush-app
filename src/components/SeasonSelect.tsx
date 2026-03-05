import { useQuery } from '@tanstack/react-query';
import { Pressable, ScrollView, Text } from 'react-native';

import { getAllSeasonsPrisma, SeasonWithStats } from '@/api/seasons';

interface SeasonSelectProps {
  selectedSeasonId: number | null;
  onSelect: (seasonId: number | null) => void;
}

function Pill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={`rounded-full px-4 py-1.5 ${selected ? 'bg-primary' : 'bg-neutral-100'}`}
      onPress={onPress}
    >
      <Text className={`text-xs font-semibold ${selected ? 'text-white' : 'text-neutral-500'}`}>
        {label}
      </Text>
    </Pressable>
  );
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
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      className="max-h-11 border-b border-neutral-100 bg-white py-2"
    >
      <Pill label="전체" selected={selectedSeasonId === null} onPress={() => onSelect(null)} />
      {seasons?.map((s: SeasonWithStats) => (
        <Pill
          key={s.season_id}
          label={s.season_name}
          selected={selectedSeasonId === s.season_id}
          onPress={() => onSelect(s.season_id)}
        />
      ))}
    </ScrollView>
  );
}
