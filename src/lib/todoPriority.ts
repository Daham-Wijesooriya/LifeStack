import type { Todo } from '@/db/schema';

/** Shared priority → color-token mapping so the flag icon means the same thing everywhere a todo's priority shows up (checklist, backlog, ...). */
export const PRIORITY_ICON_COLOR: Record<Todo['priority'], 'info' | 'warning' | 'danger'> = {
  low: 'info',
  medium: 'warning',
  high: 'danger',
};
