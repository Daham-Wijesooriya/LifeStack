import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button, DateField, Input, Sheet, Text, TimeField } from '@/components/ui';
import type { Todo } from '@/db/schema';
import { addMinutesHHmm, hhmmToMinutes, nowHHmm, todayISO } from '@/lib/date';
import type { NewTodoInput } from '@/store/todosStore';

const PRIORITIES: Todo['priority'][] = ['low', 'medium', 'high'];

export interface TodoFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: NewTodoInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  /** Present for editing an existing todo; absent for creating a new one. */
  initialTodo?: Todo;
  /**
   * Pre-fills the date (and optionally a start time) when opened from the
   * timeline — a tapped grid slot passes `startTime`, a plain "add task for
   * this day" action omits it and leaves the task unscheduled.
   */
  initialSlot?: { dueDate: string; startTime?: string };
}

function defaultStart(): string {
  // Rounds up to the next half hour so a freshly-created block doesn't start
  // in the past relative to "now".
  const minutes = hhmmToMinutes(nowHHmm());
  return addMinutesHHmm('00:00', Math.ceil(minutes / 30) * 30);
}

export function TodoFormSheet({ visible, onClose, onSubmit, onDelete, initialTodo, initialSlot }: TodoFormSheetProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [timeBoxed, setTimeBoxed] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [priority, setPriority] = useState<Todo['priority']>('medium');
  const [tag, setTag] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setTitle(initialTodo?.title ?? '');
    setNotes(initialTodo?.notes ?? '');
    setPriority(initialTodo?.priority ?? 'medium');
    setTag(initialTodo?.tag ?? '');
    setError(null);

    if (initialTodo) {
      setDueDate(initialTodo.dueDate ?? null);
      setTimeBoxed(Boolean(initialTodo.startTime && initialTodo.endTime));
      setStartTime(initialTodo.startTime ?? defaultStart());
      setEndTime(initialTodo.endTime ?? addMinutesHHmm(initialTodo.startTime ?? defaultStart(), 60));
    } else if (initialSlot) {
      setDueDate(initialSlot.dueDate);
      if (initialSlot.startTime) {
        setTimeBoxed(true);
        setStartTime(initialSlot.startTime);
        setEndTime(addMinutesHHmm(initialSlot.startTime, 60));
      } else {
        setTimeBoxed(false);
        const start = defaultStart();
        setStartTime(start);
        setEndTime(addMinutesHHmm(start, 60));
      }
    } else {
      setDueDate(todayISO());
      setTimeBoxed(false);
      const start = defaultStart();
      setStartTime(start);
      setEndTime(addMinutesHHmm(start, 60));
    }
  }, [visible, initialTodo, initialSlot]);

  function handleStartChange(next: string) {
    setStartTime(next);
    // Keep the block's duration when the start moves, instead of letting
    // start slide past (or far ahead of) a now-stale end time.
    if (hhmmToMinutes(endTime) <= hhmmToMinutes(next)) {
      setEndTime(addMinutesHHmm(next, 30));
    }
  }

  async function handleSubmit() {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (timeBoxed && hhmmToMinutes(endTime) <= hhmmToMinutes(startTime)) {
      setError('End time must be after start time');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        notes: notes.trim() || null,
        dueDate,
        startTime: timeBoxed && dueDate ? startTime : null,
        endTime: timeBoxed && dueDate ? endTime : null,
        priority,
        tag: tag.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    setSubmitting(true);
    try {
      await onDelete();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View className="gap-md pb-lg">
        <Text variant="lg" weight="semibold">
          {initialTodo ? 'Edit task' : 'New task'}
        </Text>

        <Input label="Title" value={title} onChangeText={setTitle} placeholder="Finish the report" />
        <Input
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional details"
          multiline
          numberOfLines={3}
        />
        <DateField label="Date" value={dueDate} onChange={setDueDate} placeholder="Someday (no date)" />

        <View className="gap-xs">
          <View className="flex-row items-center justify-between">
            <Text variant="sm" weight="medium" color="secondary">
              Time block
            </Text>
            <View className="flex-row gap-sm">
              <Button
                variant={!timeBoxed ? 'primary' : 'outline'}
                size="sm"
                onPress={() => setTimeBoxed(false)}
                disabled={!dueDate}
              >
                None
              </Button>
              <Button variant={timeBoxed ? 'primary' : 'outline'} size="sm" onPress={() => setTimeBoxed(true)} disabled={!dueDate}>
                Schedule
              </Button>
            </View>
          </View>
          {!dueDate ? (
            <Text variant="xs" color="muted">
              Set a date to place this on the day timeline.
            </Text>
          ) : null}
          {timeBoxed && dueDate ? (
            <View className="flex-row gap-sm">
              <View className="flex-1">
                <TimeField label="Start" value={startTime} onChange={handleStartChange} />
              </View>
              <View className="flex-1">
                <TimeField label="End" value={endTime} onChange={setEndTime} />
              </View>
            </View>
          ) : null}
        </View>

        <View className="gap-xs">
          <Text variant="sm" weight="medium" color="secondary">
            Priority
          </Text>
          <View className="flex-row gap-sm">
            {PRIORITIES.map((option) => (
              <Button
                key={option}
                variant={priority === option ? 'primary' : 'outline'}
                size="sm"
                onPress={() => setPriority(option)}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Button>
            ))}
          </View>
        </View>

        <Input label="Tag" value={tag} onChangeText={setTag} placeholder="Optional, e.g. work" />

        {error ? (
          <Text variant="sm" color="danger">
            {error}
          </Text>
        ) : null}

        <Button variant="primary" onPress={handleSubmit} loading={submitting}>
          {initialTodo ? 'Save changes' : 'Create task'}
        </Button>
        {onDelete ? (
          <Button variant="danger" onPress={handleDelete} loading={submitting}>
            Delete
          </Button>
        ) : null}
      </View>
    </Sheet>
  );
}
