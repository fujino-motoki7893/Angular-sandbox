import { Component, input, output } from '@angular/core';

import { TimerMode, TimerPreset } from '../../timer.model';

@Component({
  selector: 'app-mode-selector',
  templateUrl: './mode-selector.html',
  styleUrl: './mode-selector.css',
})
export class ModeSelector {
  readonly presets = input.required<readonly TimerPreset[]>();
  readonly selectedMode = input.required<TimerMode>();
  readonly modeSelected = output<TimerMode>();
}
