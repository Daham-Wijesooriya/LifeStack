import { create } from 'zustand';

import { db } from '@/db/client';
import { createTodosRepository } from '@/db/repositories';
import type { Todo } from '@/db/schema';
import { nowISO } from '@/lib/date';

const repo = createTodosRepository(db);

export interface NewTodoInput {
  title: string;
  notes: string | null;
  dueDate: string | null;
  /** "HH:mm", or null for an untimed todo. Only meaningful alongside dueDate. */
  startTime: string | null;
  endTime: string | null;
  priority: 'low' | 'medium' | 'high';
  tag: string | null;
}

interface TodosState {
  todos: Todo[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  loadTodos: () => Promise<void>;
  createTodo: (input: NewTodoInput) => Promise<void>;
  updateTodo: (id: number, input: NewTodoInput) => Promise<void>;
  toggleCompleted: (id: number) => Promise<void>;
  deleteTodo: (id: number) => Promise<void>;
}

export const useTodosStore = create<TodosState>((set, get) => ({
  todos: [],
  status: 'idle',
  error: null,

  async loadTodos() {
    set({ status: 'loading', error: null });
    try {
      const todos = await repo.getAll();
      set({ todos, status: 'ready' });
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) });
    }
  },

  // Unlike habits (which keep a per-item logs array that has to stay in
  // sync), a todo IS its own row — direct local updates from the repo's
  // returned row are enough, no need to reload the whole list each time.
  async createTodo(input) {
    const created = await repo.create({ ...input, completed: false, createdAt: nowISO(), completedAt: null });
    set((state) => ({ todos: [created, ...state.todos] }));
  },

  async updateTodo(id, input) {
    const updated = await repo.update(id, input);
    set((state) => ({ todos: state.todos.map((todo) => (todo.id === id ? updated : todo)) }));
  },

  async toggleCompleted(id) {
    const todo = get().todos.find((t) => t.id === id);
    if (!todo) return;
    const completed = !todo.completed;
    const updated = await repo.update(id, { completed, completedAt: completed ? nowISO() : null });
    set((state) => ({ todos: state.todos.map((t) => (t.id === id ? updated : t)) }));
  },

  async deleteTodo(id) {
    await repo.delete(id);
    set((state) => ({ todos: state.todos.filter((todo) => todo.id !== id) }));
  },
}));
