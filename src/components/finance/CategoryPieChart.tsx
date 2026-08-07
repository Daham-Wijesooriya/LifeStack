import { View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

import { Text } from '@/components/ui';
import type { CategoryTotal } from '@/hooks/useFinanceStats';
import { useTheme } from '@/theme/ThemeProvider';

const PALETTE = ['#5B5BD6', '#1E9E6A', '#D0403A', '#B8860B', '#2E7BC4', '#C2469B', '#4B4B57', '#8A8A94'] as const;

function paletteColor(index: number): string {
  return PALETTE[index % PALETTE.length] ?? PALETTE[0];
}

export interface CategoryPieChartProps {
  categories: CategoryTotal[];
}

export function CategoryPieChart({ categories }: CategoryPieChartProps) {
  const { colors } = useTheme();

  if (categories.length === 0) {
    return (
      <Text variant="sm" color="secondary">
        No expenses logged this month yet.
      </Text>
    );
  }

  const total = categories.reduce((sum, category) => sum + category.total, 0);
  const pieData = categories.map((category, index) => ({
    value: category.total,
    color: paletteColor(index),
  }));

  return (
    <View className="flex-row items-center gap-lg">
      <PieChart data={pieData} donut radius={70} innerRadius={45} innerCircleColor={colors.surface} />
      <View className="flex-1 gap-xs">
        {categories.map((category, index) => (
          <View key={category.category} className="flex-row items-center justify-between gap-sm">
            <View className="flex-row items-center gap-sm">
              <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: paletteColor(index) }} />
              <Text variant="sm">{category.category}</Text>
            </View>
            <Text variant="sm" color="secondary">
              {total > 0 ? Math.round((category.total / total) * 100) : 0}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
