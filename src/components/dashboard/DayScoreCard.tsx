import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';

export interface DayScoreBreakdownItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** 0-1, or null when there's nothing logged yet to score this part of the day. */
  ratio: number | null;
}

export interface DayScoreCardProps {
  items: DayScoreBreakdownItem[];
}

const TIER_MESSAGES: { min: number; message: string }[] = [
  { min: 85, message: "You're crushing today." },
  { min: 60, message: 'Solid progress — keep going.' },
  { min: 30, message: 'Still time to turn today around.' },
  { min: 0, message: "Let's get something logged." },
];

/**
 * Hero "day score" — an equal-weight average of whichever of habits / todos
 * / sleep already have something logged today (parts with nothing logged
 * yet are excluded rather than counted as 0, so the score reflects actual
 * follow-through and not just how early in the day it is).
 */
export function DayScoreCard({ items }: DayScoreCardProps) {
  const { colors } = useTheme();
  const scored = items.filter((item): item is DayScoreBreakdownItem & { ratio: number } => item.ratio !== null);
  const score = scored.length > 0 ? Math.round((scored.reduce((sum, item) => sum + item.ratio, 0) / scored.length) * 100) : null;
  const message = score === null ? 'Log a habit, task, or sleep to start today’s score.' : (TIER_MESSAGES.find((t) => score >= t.min)?.message ?? '');

  return (
    // LinearGradient isn't a NativeWind-registered component, so `className`
    // has no effect on it — it only ever paints the absolute-fill
    // background; every bit of padding/gap/layout below lives on plain
    // Views stacked on top of it instead.
    <View style={{ borderRadius: 24, overflow: 'hidden' }}>
      <LinearGradient
        colors={[colors.primary, `${colors.primary}99`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View className="gap-md p-lg">
        <View className="flex-row items-end justify-between">
          <View className="gap-xs">
            <Text variant="sm" weight="medium" style={{ color: colors.primaryText, opacity: 0.85 }}>
              Today's score
            </Text>
            <View className="flex-row items-baseline gap-xs">
              <Text weight="bold" style={{ color: colors.primaryText, fontSize: 44, lineHeight: 48 }}>
                {score === null ? '—' : score}
              </Text>
              {score !== null ? (
                <Text weight="semibold" style={{ color: colors.primaryText, opacity: 0.85 }} variant="lg">
                  %
                </Text>
              ) : null}
            </View>
          </View>
          <Ionicons name="sparkles" size={28} color={colors.primaryText} style={{ opacity: 0.7 }} />
        </View>

        <Text variant="sm" style={{ color: colors.primaryText, opacity: 0.9 }}>
          {message}
        </Text>

        <View className="flex-row gap-md pt-xs">
          {items.map((item) => (
            <View key={item.key} className="flex-1 gap-xs rounded-xl p-sm" style={{ backgroundColor: `${colors.primaryText}1A` }}>
              <View className="flex-row items-center gap-xs">
                <Ionicons name={item.icon} size={13} color={colors.primaryText} style={{ opacity: 0.85 }} />
                <Text variant="xs" weight="medium" style={{ color: colors.primaryText, opacity: 0.85 }}>
                  {item.label}
                </Text>
              </View>
              <Text weight="bold" style={{ color: colors.primaryText }}>
                {item.ratio === null ? '—' : `${Math.round(item.ratio * 100)}%`}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
