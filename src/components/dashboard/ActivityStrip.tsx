import { Pressable, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Text } from '@/components/ui';
import { todayISO } from '@/lib/date';
import { useTheme } from '@/theme/ThemeProvider';

export interface ActivityStripDay {
  date: string;
  /** Single-letter day label (M, T, W, ...). */
  label: string;
  /** 0-1: fraction of active habits completed that day. */
  ratio: number;
}

export interface ActivityStripProps {
  days: ActivityStripDay[];
  /** Optional — when given, each day becomes a button (e.g. jump to Habits to fill in that day). */
  onPressDay?: (date: string) => void;
}

const SIZE = 32;
const STROKE = 3;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * A lightweight 7-day glance, not a per-habit stat — that lives on each
 * habit's own detail screen. Each day is its own small progress ring (the
 * actual completion ratio, not a coarse 3-tier fill) so partial days read as
 * partial, not rounded up/down to "some". Tapping a day is optional —
 * Dashboard wires it to jump into Habits.
 */
export function ActivityStrip({ days, onPressDay }: ActivityStripProps) {
  const { colors } = useTheme();
  const today = todayISO();

  return (
    <View className="flex-row justify-between">
      {days.map((day) => {
        const isToday = day.date === today;
        const pct = Math.max(0, Math.min(1, day.ratio));
        const dashOffset = CIRCUMFERENCE * (1 - pct);
        return (
          <Pressable
            key={day.date}
            onPress={onPressDay ? () => onPressDay(day.date) : undefined}
            disabled={!onPressDay}
            accessibilityRole={onPressDay ? 'button' : undefined}
            accessibilityLabel={`${day.label}, ${Math.round(pct * 100)}% of habits done`}
            hitSlop={4}
            className="items-center gap-xs active:opacity-70"
          >
            <View style={{ width: SIZE, height: SIZE }}>
              <Svg width={SIZE} height={SIZE}>
                <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke={colors.border} strokeWidth={STROKE} fill="none" />
                {pct > 0 ? (
                  <Circle
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    stroke={colors.primary}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                    strokeDashoffset={dashOffset}
                    rotation={-90}
                    origin={`${SIZE / 2}, ${SIZE / 2}`}
                  />
                ) : null}
              </Svg>
            </View>
            <Text variant="xs" color="muted" weight={isToday ? 'semibold' : 'normal'}>
              {day.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
