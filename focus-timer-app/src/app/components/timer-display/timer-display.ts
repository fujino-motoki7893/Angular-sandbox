import { Component, input } from '@angular/core';

@Component({
  selector: 'app-timer-display',
  templateUrl: './timer-display.html',
  styleUrl: './timer-display.css',
})
export class TimerDisplay {
  readonly caption = input.required<string>();
  readonly formattedTime = input.required<string>();
  readonly statusText = input.required<string>();
  readonly ringBackground = input.required<string>();
}
