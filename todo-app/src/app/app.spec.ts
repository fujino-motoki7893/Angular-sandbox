import { TestBed } from '@angular/core/testing';
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

  it('should render the todo app title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('今日のタスク');
  });

  it('should add a new todo from the form', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector<HTMLInputElement>('#new-todo');
    const form = compiled.querySelector<HTMLFormElement>('.todo-form');

    input!.value = 'Read Angular docs';
    input!.dispatchEvent(new Event('input'));
    form!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.textContent).toContain('Read Angular docs');
  });

  it('should keep an intentionally empty saved todo list', async () => {
    localStorage.setItem('todo-app.todos', '[]');

    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Add your first task to get started.');
    expect(compiled.textContent).not.toContain('Create the Angular project');
  });
});
