import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the focus timer title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Deep work, gently paced.');
  });

  it('should switch to short break mode', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const shortBreakButton = Array.from(compiled.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Short Break'),
    );

    shortBreakButton?.click();
    fixture.detectChanges();

    expect(compiled.textContent).toContain('05:00');
  });

  it('should count a completed focus session', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const completeButton = Array.from(compiled.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Complete',
    );

    completeButton?.click();
    fixture.detectChanges();

    expect(compiled.textContent).toContain('1');
    expect(localStorage.getItem('focus-timer-app.state')).toContain('"completedSessions":1');
  });

  it('should automatically cycle from focus to short break and back to focus', () => {
    vi.useFakeTimers();

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const startButton = Array.from(compiled.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Start',
    );

    startButton?.click();
    fixture.detectChanges();

    vi.advanceTimersByTime(25 * 60 * 1000);
    fixture.detectChanges();

    expect(compiled.textContent).toContain('05:00');
    expect(compiled.textContent).toContain('1');

    vi.advanceTimersByTime(5 * 60 * 1000);
    fixture.detectChanges();

    expect(compiled.textContent).toContain('25:00');

    fixture.destroy();
    vi.useRealTimers();
  });
});
