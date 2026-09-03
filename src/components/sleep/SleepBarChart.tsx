import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { useTheme } from '@/theme/ThemeProvider';

export interface SleepBarChartPoint {
  label: string;
  hours: number;
}

export interface SleepBarChartProps {
  data: SleepBarChartPoint[];
}

const Y_AXIS_LABEL_WIDTH = 26;
const EDGE_SPACING = 8;
const MIN_BAR_WIDTH = 3;
const MIN_SPACING = 2;
// High enough that a short range (7 days) stretches to fill the card's full
// width instead of clamping thin and leaving empty space on the right — the
// lower MIN_BAR_WIDTH is what actually keeps a long range (30 days) legible.
const MAX_BAR_WIDTH = 48;

export function SleepBarChart({ data }: SleepBarChartProps) {
  const { colors } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);

  function handleLayout(event: LayoutChangeEvent) {
    setContainerWidth(event.nativeEvent.layout.width);
  }

  const barData = data.map((point) => ({
    value: Math.round(point.hours * 10) / 10,
    label: point.label,
    frontColor: colors.primary,
  }));

  // Solve for a bar/spacing pair (kept at a fixed ~4:3 ratio) that makes the
  // whole chart land inside the card's own measured width instead of the
  // chart's natural width — a fixed barWidth/spacing meant every bar fit for
  // 7 days but ran wider than the card for 30, spilling past its border.
  const barCount = Math.max(1, data.length);
  const chartWidth = Math.max(0, containerWidth - Y_AXIS_LABEL_WIDTH);
  const available = Math.max(0, chartWidth - EDGE_SPACING * 2);
  const rawBarWidth = available / (barCount + 0.75 * (barCount - 1));
  const barWidth = Math.max(MIN_BAR_WIDTH, Math.min(MAX_BAR_WIDTH, rawBarWidth));
  const spacing = Math.max(MIN_SPACING, barWidth * 0.75);

  return (
    <View onLayout={handleLayout}>
      {containerWidth > 0 ? (
        <BarChart
          data={barData}
          width={chartWidth}
          height={195}
          barWidth={barWidth}
          spacing={spacing}
          initialSpacing={EDGE_SPACING}
          endSpacing={EDGE_SPACING}
          roundedTop
          noOfSections={4}
          maxValue={12}
          hideRules
          xAxisThickness={1}
          yAxisThickness={0}
          yAxisLabelWidth={Y_AXIS_LABEL_WIDTH}
          xAxisColor={colors.border}
          yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
          xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
        />
      ) : null}
    </View>
  );
}
