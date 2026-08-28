import { TestBed } from '@angular/core/testing';
import { UiSelect } from './ui-select';

describe('UiSelect', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiSelect],
    }).compileComponents();
  });

  function mount(extras?: { required?: boolean; filter?: boolean; disabled?: boolean; options?: { value: string; label: string }[] }) {
    const fixture = TestBed.createComponent(UiSelect);
    const emitted: string[] = [];
    fixture.componentRef.setInput('id', 'doc');
    fixture.componentRef.setInput('label', 'Tipo de documento');
    fixture.componentRef.setInput('options', extras?.options ?? [
      { value: 'dni', label: 'DNI' },
      { value: 'nie', label: 'NIE' },
    ]);
    if (extras?.required) fixture.componentRef.setInput('required', true);
    if (extras?.filter) fixture.componentRef.setInput('filter', true);
    if (extras?.disabled) fixture.componentRef.setInput('disabled', true);
    fixture.componentInstance.valueChange.subscribe((value) => emitted.push(value));
    fixture.detectChanges();
    return { fixture, emitted };
  }

  it('abre la lista y selecciona una opción', () => {
    const { fixture, emitted } = mount();
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

  it('marca el campo requerido y no abre si está deshabilitado', () => {
    const required = mount({ required: true });
    expect((required.fixture.nativeElement as HTMLElement).textContent).toContain('*');

    const locked = mount({ disabled: true });
    const trigger = (locked.fixture.nativeElement as HTMLElement).querySelector('.sm__trigger') as HTMLButtonElement;
    trigger.click();
    locked.fixture.detectChanges();
    expect(locked.fixture.componentInstance.open()).toBe(false);
  });

  it('filtra opciones y muestra el vacío si no hay coincidencias', () => {
    const { fixture } = mount({ filter: true });
    const trigger = (fixture.nativeElement as HTMLElement).querySelector('.sm__trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();

    const search = (fixture.nativeElement as HTMLElement).querySelector('.sm__search') as HTMLInputElement;
    search.value = 'nie';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('NIE');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('DNI');

    search.value = 'zzz';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No se encontraron resultados.');
  });
});
