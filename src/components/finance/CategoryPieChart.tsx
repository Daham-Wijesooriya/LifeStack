import { View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

import { Text } from '@/components/ui';
import type { CategoryTotal } from '@/hooks/useFinanceStats';
import { useAccentPalette } from '@/theme/accentPalette';
import { useTheme } from '@/theme/ThemeProvider';

export interface CategoryPieChartProps {
  categories: CategoryTotal[];
}

export function CategoryPieChart({ categories }: CategoryPieChartProps) {
  const { colors } = useTheme();
  // Themed accent palette, extended with the neutral text tones so a
  // category list longer than the accent set still has distinct slices.
  const accentPalette = useAccentPalette();
  const palette = [...accentPalette, colors.textSecondary, colors.textMuted];
  const paletteColor = (index: number): string => palette[index % palette.length] ?? accentPalette[0];

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
