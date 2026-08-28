import { TestBed } from '@angular/core/testing';
import { UiSelect } from './ui-select';

describe('UiSelect', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiSelect],
    }).compileComponents();
  });

  it('abre la lista y selecciona una opción', () => {
    const fixture = TestBed.createComponent(UiSelect);
    const emitted: string[] = [];
    fixture.componentRef.setInput('id', 'doc');
    fixture.componentRef.setInput('label', 'Tipo de documento');
    fixture.componentRef.setInput('options', [
      { value: 'dni', label: 'DNI' },
      { value: 'nie', label: 'NIE' },
    ]);
    fixture.componentInstance.valueChange.subscribe((value) => emitted.push(value));
    fixture.detectChanges();

    const trigger = (fixture.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    const option = (fixture.nativeElement as HTMLElement).querySelector('[role="option"]') as HTMLButtonElement;
    option.click();
    fixture.detectChanges();
    expect(emitted).toEqual(['dni']);
    expect(fixture.componentInstance.open()).toBe(false);
  });
});
