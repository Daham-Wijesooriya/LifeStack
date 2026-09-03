import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StatCard } from '@/components/dashboard';
import { SleepBarChart, SleepLogFormSheet, SleepLogRow } from '@/components/sleep';
import { Button, Card, EmptyState, Text } from '@/components/ui';
import type { SleepLog } from '@/db/schema';
import { computeSleepConsistency, formatDurationMinutes, lastNDaysISO } from '@/lib/date';
import { useSleepStore } from '@/store/sleepStore';
import { useTheme } from '@/theme/ThemeProvider';

type Range = 7 | 30;

export default function SleepScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { logs, status, error, loadLogs, createLog, updateLog, deleteLog } = useSleepStore();
  const [range, setRange] = useState<Range>(7);
  const [formVisible, setFormVisible] = useState(false);
  const [editingLog, setEditingLog] = useState<SleepLog | undefined>(undefined);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const days = useMemo(() => lastNDaysISO(range), [range]);

  const logsByDate = useMemo(() => {
    const map = new Map<string, SleepLog[]>();
    for (const log of logs) {
      const existing = map.get(log.date) ?? [];
      existing.push(log);
      map.set(log.date, existing);
    }
    return map;
  }, [logs]);

  const chartData = useMemo(
    () =>
      days.map((day) => {
        const dayLogs = logsByDate.get(day) ?? [];
        const totalMinutes = dayLogs.reduce((sum, log) => sum + log.durationMinutes, 0);
        return {
          label: format(parseISO(day), range === 7 ? 'EEE' : 'd'),
          hours: totalMinutes / 60,
        };
      }),
    [days, logsByDate, range],
  );

  const logsInRange = useMemo(() => logs.filter((log) => days.includes(log.date)), [logs, days]);

  const averageMinutes =
    logsInRange.length === 0
      ? 0
      : Math.round(logsInRange.reduce((sum, log) => sum + log.durationMinutes, 0) / logsInRange.length);
  const consistency = computeSleepConsistency(logsInRange.map((log) => log.bedtime));

  function openCreate() {
    setEditingLog(undefined);
    setFormVisible(true);
  }

  function openEdit(log: SleepLog) {
    setEditingLog(log);
    setFormVisible(true);
  }

  if (status === 'loading' || status === 'idle') {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text color="secondary">Loading sleep logs…</Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View className="flex-1 items-center justify-center bg-background px-xl">
        <Text color="danger">{error}</Text>
      </View>
    );
  }

  return (
    // No (tabs) screen gets a native header, so the safe-area top inset has
    // to be handled here explicitly — see app/(tabs)/index.tsx for the same
    // fix and why a flat pt-lg isn't enough on notched devices.
    <View className="flex-1 bg-background px-lg" style={{ paddingTop: insets.top + 16 }}>
      <View className="pb-sm">
        <Text variant="xl" weight="semibold">
          Sleep
        </Text>
        <Text variant="sm" color="secondary">
          {logs.length > 0 ? `${logsInRange.length} logs in the last ${range} days` : 'Track your rest'}
        </Text>
      </View>

      <View className="flex-row gap-sm pb-md">
        <Button variant={range === 7 ? 'primary' : 'outline'} size="sm" onPress={() => setRange(7)}>
          7 days
        </Button>
        <Button variant={range === 30 ? 'primary' : 'outline'} size="sm" onPress={() => setRange(30)}>
          30 days
        </Button>
      </View>

      <FlatList
        data={logsInRange}
        keyExtractor={(log) => String(log.id)}
        contentContainerClassName="gap-sm"
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          logs.length > 0 ? (
            <View className="gap-md pb-md">
              <Card>
                <SleepBarChart data={chartData} />
              </Card>
              <View className="flex-row gap-md">
                <StatCard
                  label="Average"
                  value={formatDurationMinutes(averageMinutes)}
                  icon={<Ionicons name="moon-outline" size={16} color={colors.info} />}
                />
                <StatCard
                  label="Consistency"
                  value={`${consistency}%`}
                  valueColor="success"
                  icon={<Ionicons name="pulse-outline" size={16} color={colors.success} />}
                />
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          logs.length === 0 ? (
            <EmptyState
              icon={<Ionicons name="moon-outline" size={40} color={colors.textMuted} />}
              title="No sleep logs yet"
              description="Log tonight's bedtime and wake time to start tracking."
              actionLabel="Add sleep log"
              onAction={openCreate}
            />
          ) : (
            <Text variant="sm" color="muted" className="py-lg text-center">
              No logs in the last {range} days.
            </Text>
          )
        }
        renderItem={({ item }) => <SleepLogRow log={item} onPress={() => openEdit(item)} />}
      />

      <Pressable
        onPress={openCreate}
        accessibilityRole="button"
        accessibilityLabel="Add sleep log"
        className="absolute bottom-xl right-lg h-14 w-14 items-center justify-center rounded-full bg-primary active:opacity-80"
        style={{ bottom: insets.bottom + 24 }}
      >
        <Ionicons name="add" size={28} color={colors.primaryText} />
      </Pressable>

      <SleepLogFormSheet
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        initialLog={editingLog}
        onSubmit={async (input) => {
          if (editingLog) {
            await updateLog(editingLog.id, input);
          } else {
            await createLog(input);
          }
        }}
        onDelete={
          editingLog
            ? async () => {
                await deleteLog(editingLog.id);
              }
            : undefined
        }
      />
    </View>
  );
}
