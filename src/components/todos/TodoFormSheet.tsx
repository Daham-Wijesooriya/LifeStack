import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button, DateField, Input, Sheet, Text } from '@/components/ui';
import type { Todo } from '@/db/schema';
import type { NewTodoInput } from '@/store/todosStore';

const PRIORITIES: Todo['priority'][] = ['low', 'medium', 'high'];

export interface TodoFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: NewTodoInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  /** Present for editing an existing todo; absent for creating a new one. */
  initialTodo?: Todo;
}

export function TodoFormSheet({ visible, onClose, onSubmit, onDelete, initialTodo }: TodoFormSheetProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [priority, setPriority] = useState<Todo['priority']>('medium');
  const [tag, setTag] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setTitle(initialTodo?.title ?? '');
    setNotes(initialTodo?.notes ?? '');
    setDueDate(initialTodo?.dueDate ?? null);
    setPriority(initialTodo?.priority ?? 'medium');
    setTag(initialTodo?.tag ?? '');
    setError(null);
  }, [visible, initialTodo]);

  async function handleSubmit() {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        notes: notes.trim() || null,
        dueDate,
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
          {initialTodo ? 'Edit todo' : 'New todo'}
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
        <DateField label="Due date" value={dueDate} onChange={setDueDate} placeholder="No due date" />

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
          {initialTodo ? 'Save changes' : 'Create todo'}
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
