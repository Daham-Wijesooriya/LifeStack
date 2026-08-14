import { useRef } from 'react';
import { ScrollView, View } from 'react-native';

import { Text } from '@/components/ui';
import type { HabitHeatmapDay } from '@/hooks/useHabitStats';
import { todayISO } from '@/lib/date';

export interface HabitHeatmapProps {
  days: HabitHeatmapDay[];
  color: string;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * A GitHub contributions style 52-week horizontal scrolling grid (7 rows representing days
 * of the week, 52 columns representing weeks) flowing chronologically from left to right.
 * Features Month labels at the top and Day labels on the left.
 */
export function HabitHeatmap({ days, color }: HabitHeatmapProps) {
  const weeks = chunk(days, 7);
  const scrollViewRef = useRef<ScrollView>(null);
  const today = todayISO();

  // Calculate month labels dynamically at week boundaries
  const monthLabels: { label: string; offset: number }[] = [];
  weeks.forEach((week, idx) => {
    const firstDay = week[0];
    if (!firstDay) return;

    const [year = 0, month = 1, day = 1] = firstDay.date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const monthName = dateObj.toLocaleString('en-US', { month: 'short' });

    const prevWeek = weeks[idx - 1];
    let prevMonthName = '';
    if (prevWeek && prevWeek[0]) {
      const [py = 0, pm = 1, pd = 1] = prevWeek[0].date.split('-').map(Number);
      prevMonthName = new Date(py, pm - 1, pd).toLocaleString('en-US', { month: 'short' });
    }

    const lastLabel = monthLabels[monthLabels.length - 1];
    const distance = lastLabel ? idx - lastLabel.offset : 999;

    if (idx === 0 || (monthName !== prevMonthName && distance >= 3)) {
      monthLabels.push({
        label: monthName,
        offset: idx,
      });
    }
  });

  const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <View className="flex-row items-end">
      {/* Day Labels (fixed on the left) */}
      <View className="gap-[2px] pr-xs pb-[2px]">
        {DAY_LABELS.map((label, idx) => (
          <View key={idx} className="h-[11px] justify-center w-6">
            {label ? (
              <Text className="text-[8px] text-text-muted font-medium" style={{ lineHeight: 11 }}>
                {label}
              </Text>
            ) : null}
          </View>
        ))}
      </View>

      {/* Scrollable Heatmap Grid */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-1"
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
      >
        <View className="flex-col">
          {/* Month Labels Row */}
          <View className="h-4 w-full relative mb-1">
            {monthLabels.map(({ label, offset }) => (
              <Text
                key={offset}
                className="text-[8px] text-text-muted font-medium"
                style={{ position: 'absolute', left: offset * 13 }}
              >
                {label}
              </Text>
            ))}
          </View>

          {/* Grid of Dots */}
          <View className="flex-row gap-[2px] pr-md">
            {weeks.map((week, weekIdx) => (
              <View key={weekIdx} className="gap-[2px] w-[11px]">
                {week.map((day) => {
                  if (day.isPlaceholder) {
                    return <View key={day.date} className="h-[11px] w-[11px]" />;
                  }
                  const isToday = day.date === today;
                  return (
                    <View
                      key={day.date}
                      className="h-[11px] w-[11px] rounded-[2px]"
                      style={[
                        // base background
                        { borderWidth: 1, borderColor: 'rgba(125,125,125,0.3)', backgroundColor: 'rgba(125,125,125,0.1)' },
                        // completed fill
                        day.completed ? { backgroundColor: color, borderColor: color } : {},
                        // today outline — always visible on top of everything
                        isToday ? { borderWidth: 2, borderColor: '#FFFFFF' } : {},
                      ]}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
