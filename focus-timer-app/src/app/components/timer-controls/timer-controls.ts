import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-timer-controls',
  templateUrl: './timer-controls.html',
  styleUrl: './timer-controls.css',
})
export class TimerControls {
  readonly isRunning = input.required<boolean>();

  readonly timerToggled = output<void>();
  readonly timerReset = output<void>();
  readonly sessionCompleted = output<void>();
}
