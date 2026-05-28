export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

export interface TimerPreset {
  mode: TimerMode;
  label: string;
  minutes: number;
  caption: string;
}
