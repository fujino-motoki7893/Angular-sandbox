import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-session-stats',
  templateUrl: './session-stats.html',
  styleUrl: './session-stats.css',
})
export class SessionStats {
  readonly completedSessions = input.required<number>();
  readonly focusMinutes = input.required<number>();
  readonly nextBreakLabel = input.required<string>();

  readonly recommendedBreakSelected = output<void>();
  readonly todayReset = output<void>();
}
