import { Component, OnDestroy, computed, effect, signal } from '@angular/core';

import { ModeSelector } from './components/mode-selector/mode-selector';
import { SessionStats } from './components/session-stats/session-stats';
import { TimerControls } from './components/timer-controls/timer-controls';
import { TimerDisplay } from './components/timer-display/timer-display';
import { TimerMode, TimerPreset } from './timer.model';

interface SavedTimerState {
  selectedMode: TimerMode;
  completedSessions: number;
  savedAt: string;
}

const STORAGE_KEY = 'focus-timer-app.state';
const DEFAULT_MODE: TimerMode = 'focus';

@Component({
  selector: 'app-root',
  imports: [ModeSelector, TimerDisplay, TimerControls, SessionStats],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnDestroy {
  protected readonly presets: readonly TimerPreset[] = [
    {
      mode: 'focus',
      label: 'Focus',
      minutes: 25,
      caption: 'Deep work',
    },
    {
      mode: 'shortBreak',
      label: 'Short Break',
      minutes: 5,
      caption: 'Reset',
    },
    {
      mode: 'longBreak',
      label: 'Long Break',
      minutes: 15,
      caption: 'Recover',
    },
  ];

  private readonly savedState = this.loadState();
  private intervalId: ReturnType<typeof setInterval> | undefined;

  protected readonly selectedMode = signal<TimerMode>(this.savedState.selectedMode);
  protected readonly secondsRemaining = signal(this.durationFor(this.savedState.selectedMode));
  protected readonly completedSessions = signal(this.savedState.completedSessions);
  protected readonly isRunning = signal(false);
  protected readonly lastCompletedMode = signal<TimerMode | null>(null);

  protected readonly activePreset = computed(() => this.findPreset(this.selectedMode()));
  protected readonly totalSeconds = computed(() => this.activePreset().minutes * 60);
  protected readonly elapsedSeconds = computed(() => this.totalSeconds() - this.secondsRemaining());
  protected readonly progress = computed(() => {
    const total = this.totalSeconds();
    return total === 0 ? 0 : Math.round((this.elapsedSeconds() / total) * 100);
  });
  protected readonly formattedTime = computed(() => this.formatTime(this.secondsRemaining()));
  protected readonly focusMinutes = computed(() => this.completedSessions() * 25);
  protected readonly nextBreakLabel = computed(() =>
    this.selectedMode() === 'focus' ? 'Short Break' : 'Focus',
  );
  protected readonly statusText = computed(() => {
    if (this.isRunning()) {
      return this.selectedMode() === 'focus'
        ? 'Stay with this one thing.'
        : 'Breathe and come back clear.';
    }

    if (this.secondsRemaining() === 0) {
      return this.lastCompletedMode() === 'focus'
        ? `${this.nextBreakLabel()} is ready.`
        : 'Ready for the next focus block.';
    }

    return this.selectedMode() === 'focus' ? 'Ready when you are.' : 'Take the break seriously.';
  });
  protected readonly ringBackground = computed(
    () =>
      `conic-gradient(#ef6f5e ${this.progress()}%, rgba(255, 255, 255, 0.18) ${this.progress()}%)`,
  );

  constructor() {
    effect(() => {
      this.saveState({
        selectedMode: this.selectedMode(),
        completedSessions: this.completedSessions(),
        savedAt: this.todayKey(),
      });
    });
  }

  ngOnDestroy(): void {
    this.stopTicker();
  }

  protected selectMode(mode: TimerMode): void {
    this.stopTicker();
    this.isRunning.set(false);
    this.selectedMode.set(mode);
    this.secondsRemaining.set(this.durationFor(mode));
    this.lastCompletedMode.set(null);
  }

  protected toggleTimer(): void {
    if (this.isRunning()) {
      this.stopTicker();
      this.isRunning.set(false);
      return;
    }

    if (this.secondsRemaining() === 0) {
      this.secondsRemaining.set(this.totalSeconds());
    }

    this.isRunning.set(true);
    this.startTicker();
  }

  protected resetTimer(): void {
    this.stopTicker();
    this.isRunning.set(false);
    this.secondsRemaining.set(this.totalSeconds());
    this.lastCompletedMode.set(null);
  }

  protected completeSession(): void {
    this.finishCurrentMode();
  }

  protected resetToday(): void {
    this.completedSessions.set(0);
  }

  protected selectRecommendedBreak(): void {
    this.selectMode(this.nextModeAfter(this.selectedMode()));
  }

  private startTicker(): void {
    this.stopTicker();
    this.intervalId = setInterval(() => {
      const currentSeconds = this.secondsRemaining();

      if (currentSeconds <= 1) {
        this.finishCurrentMode();
        return;
      }

      this.secondsRemaining.set(currentSeconds - 1);
    }, 1000);
  }

  private stopTicker(): void {
    if (this.intervalId === undefined) {
      return;
    }

    clearInterval(this.intervalId);
    this.intervalId = undefined;
  }

  private finishCurrentMode(): void {
    const completedMode = this.selectedMode();
    const shouldContinue = this.isRunning();
    const nextMode = this.nextModeAfter(completedMode);

    this.stopTicker();
    this.isRunning.set(false);
    this.lastCompletedMode.set(completedMode);

    if (completedMode === 'focus') {
      this.completedSessions.update((count) => count + 1);
    }

    this.selectedMode.set(nextMode);
    this.secondsRemaining.set(this.durationFor(nextMode));

    if (shouldContinue) {
      this.isRunning.set(true);
      this.startTicker();
    }
  }

  private nextModeAfter(mode: TimerMode): TimerMode {
    return mode === 'focus' ? 'shortBreak' : 'focus';
  }

  private findPreset(mode: TimerMode): TimerPreset {
    return this.presets.find((preset) => preset.mode === mode) ?? this.presets[0];
  }

  private durationFor(mode: TimerMode): number {
    return this.findPreset(mode).minutes * 60;
  }

  private formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  private loadState(): SavedTimerState {
    try {
      const rawState = localStorage.getItem(STORAGE_KEY);

      if (rawState === null) {
        return this.defaultState();
      }

      const parsedState: unknown = JSON.parse(rawState);

      if (!this.isSavedState(parsedState)) {
        return this.defaultState();
      }

      return {
        ...parsedState,
        completedSessions:
          parsedState.savedAt === this.todayKey() ? parsedState.completedSessions : 0,
      };
    } catch {
      return this.defaultState();
    }
  }

  private saveState(state: SavedTimerState): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  private isSavedState(value: unknown): value is SavedTimerState {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const state = value as Partial<SavedTimerState>;

    return (
      state.selectedMode !== undefined &&
      ['focus', 'shortBreak', 'longBreak'].includes(state.selectedMode) &&
      typeof state.completedSessions === 'number' &&
      Number.isInteger(state.completedSessions) &&
      state.completedSessions >= 0 &&
      typeof state.savedAt === 'string'
    );
  }

  private defaultState(): SavedTimerState {
    return {
      selectedMode: DEFAULT_MODE,
      completedSessions: 0,
      savedAt: this.todayKey(),
    };
  }

  private todayKey(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
