import { View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { Text } from '@/components/ui';
import type { MonthlyTotal } from '@/hooks/useFinanceStats';
import { useTheme } from '@/theme/ThemeProvider';

export interface MonthlyTrendChartProps {
  data: MonthlyTotal[];
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  const { colors } = useTheme();

  const incomeData = data.map((point) => ({ value: point.income, label: point.label }));
  const expenseData = data.map((point) => ({ value: point.expense }));

  return (
    <View className="gap-sm">
      <View className="flex-row gap-md">
        <View className="flex-row items-center gap-xs">
          <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.success }} />
          <Text variant="sm" color="secondary">
            Income
          </Text>
        </View>
        <View className="flex-row items-center gap-xs">
          <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.danger }} />
          <Text variant="sm" color="secondary">
            Expense
          </Text>
        </View>
      </View>
      <LineChart
        data={incomeData}
        data2={expenseData}
        color1={colors.success}
        color2={colors.danger}
        thickness1={2}
        thickness2={2}
        height={160}
        hideRules
        xAxisThickness={1}
        yAxisThickness={0}
        xAxisColor={colors.border}
        yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
      />
    </View>
  );
}
