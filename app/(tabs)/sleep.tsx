import { format, parseISO } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';

import { SleepBarChart, SleepLogFormSheet, SleepLogRow } from '@/components/sleep';
import { Button, Card, EmptyState, Text } from '@/components/ui';
import type { SleepLog } from '@/db/schema';
import { computeSleepConsistency, formatDurationMinutes, lastNDaysISO } from '@/lib/date';
import { useSleepStore } from '@/store/sleepStore';

type Range = 7 | 30;

export default function SleepScreen() {
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

  if (logs.length === 0) {
    return (
      <View className="flex-1 bg-background">
        <EmptyState
          title="No sleep logs yet"
          description="Log tonight's bedtime and wake time to start tracking."
          actionLabel="Add sleep log"
          onAction={openCreate}
        />
        <SleepLogFormSheet
          visible={formVisible}
          onClose={() => setFormVisible(false)}
          onSubmit={async (input) => {
            await createLog(input);
          }}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background px-lg pt-lg">
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
        contentContainerClassName="gap-sm pb-2xl"
        ListHeaderComponent={
          <View className="gap-md pb-md">
            <Card>
              <SleepBarChart data={chartData} />
            </Card>
            <View className="flex-row gap-md">
              <Card className="flex-1 items-center">
                <Text variant="xl" weight="bold">
                  {formatDurationMinutes(averageMinutes)}
                </Text>
                <Text variant="sm" color="secondary">
                  average
                </Text>
              </Card>
              <Card className="flex-1 items-center">
                <Text variant="xl" weight="bold">
                  {consistency}%
                </Text>
                <Text variant="sm" color="secondary">
                  consistency
                </Text>
              </Card>
            </View>
          </View>
        }
        renderItem={({ item }) => <SleepLogRow log={item} onPress={() => openEdit(item)} />}
        ListFooterComponent={
          <Button variant="outline" onPress={openCreate} className="mt-sm">
            + Add sleep log
          </Button>
        }
      />

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
