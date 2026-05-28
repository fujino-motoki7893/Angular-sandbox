import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

type TodoFilter = 'all' | 'active' | 'completed';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

const STORAGE_KEY = 'todo-app.todos';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly newTodo = signal('');
  protected readonly todos = signal<Todo[]>(this.loadTodos());
  protected readonly filter = signal<TodoFilter>('all');

  protected readonly filters: readonly { value: TodoFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Done' },
  ];

  protected readonly visibleTodos = computed(() => {
    const todos = this.todos();

    switch (this.filter()) {
      case 'active':
        return todos.filter((todo) => !todo.completed);
      case 'completed':
        return todos.filter((todo) => todo.completed);
      case 'all':
        return todos;
    }
  });

  protected readonly totalCount = computed(() => this.todos().length);
  protected readonly completedCount = computed(
    () => this.todos().filter((todo) => todo.completed).length,
  );
  protected readonly remainingCount = computed(() => this.totalCount() - this.completedCount());

  protected readonly emptyMessage = computed(() => {
    if (this.totalCount() === 0) {
      return 'Add your first task to get started.';
    }

    if (this.filter() === 'active') {
      return 'No active tasks. Nice work.';
    }

    if (this.filter() === 'completed') {
      return 'No completed tasks yet.';
    }

    return 'No tasks to show.';
  });

  constructor() {
    effect(() => {
      this.saveTodos(this.todos());
    });
  }

  protected addTodo(): void {
    const title = this.newTodo().trim();

    if (title.length === 0) {
      return;
    }

    this.todos.update((todos) => [
      {
        id: this.nextId(todos),
        title,
        completed: false,
      },
      ...todos,
    ]);
    this.newTodo.set('');
    this.filter.set('all');
  }

  protected toggleTodo(id: number): void {
    this.todos.update((todos) =>
      todos.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              completed: !todo.completed,
            }
          : todo,
      ),
    );
  }

  protected removeTodo(id: number): void {
    this.todos.update((todos) => todos.filter((todo) => todo.id !== id));
  }

  protected clearCompleted(): void {
    this.todos.update((todos) => todos.filter((todo) => !todo.completed));
  }

  protected setFilter(filter: TodoFilter): void {
    this.filter.set(filter);
  }

  private loadTodos(): Todo[] {
    if (!this.isBrowser) {
      return this.seedTodos();
    }

    try {
      const rawTodos = localStorage.getItem(STORAGE_KEY);

      if (rawTodos === null) {
        return this.seedTodos();
      }

      const parsedTodos: unknown = JSON.parse(rawTodos);

      if (!Array.isArray(parsedTodos)) {
        return this.seedTodos();
      }

      return parsedTodos.filter((todo): todo is Todo => this.isTodo(todo));
    } catch {
      return this.seedTodos();
    }
  }

  private saveTodos(todos: readonly Todo[]): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }

  private isTodo(value: unknown): value is Todo {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const todo = value as Partial<Todo>;

    return (
      typeof todo.id === 'number' &&
      typeof todo.title === 'string' &&
      todo.title.trim().length > 0 &&
      typeof todo.completed === 'boolean'
    );
  }

  private seedTodos(): Todo[] {
    return [
      { id: 1, title: 'Create the Angular project', completed: true },
      { id: 2, title: 'Build a simple todo app', completed: false },
      { id: 3, title: 'Try adding your own task', completed: false },
    ];
  }

  private nextId(todos: readonly Todo[]): number {
    return todos.length === 0 ? 1 : Math.max(...todos.map((todo) => todo.id)) + 1;
  }
}
