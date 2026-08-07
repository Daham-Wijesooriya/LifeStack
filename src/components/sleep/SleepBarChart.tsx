import { BarChart } from 'react-native-gifted-charts';

import { useTheme } from '@/theme/ThemeProvider';

export interface SleepBarChartPoint {
  label: string;
  hours: number;
}

export interface SleepBarChartProps {
  data: SleepBarChartPoint[];
}

export function SleepBarChart({ data }: SleepBarChartProps) {
  const { colors } = useTheme();
  const dense = data.length > 14;

  const barData = data.map((point) => ({
    value: Math.round(point.hours * 10) / 10,
    label: point.label,
    frontColor: colors.primary,
  }));

  return (
    <BarChart
      data={barData}
      height={160}
      barWidth={dense ? 6 : 18}
      spacing={dense ? 6 : 14}
      initialSpacing={8}
      endSpacing={8}
      roundedTop
      noOfSections={4}
      maxValue={12}
      hideRules
      xAxisThickness={1}
      yAxisThickness={0}
      xAxisColor={colors.border}
      yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
      xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
    />
  );
}
