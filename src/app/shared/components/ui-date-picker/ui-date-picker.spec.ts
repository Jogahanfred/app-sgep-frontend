import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { formatIsoDateEs, parseIsoDate, toIsoDate, UiDatePicker } from './ui-date-picker';

describe('UiDatePicker', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiDatePicker],
    }).compileComponents();
  });

  it('formatea y parsea fechas ISO', () => {
    expect(formatIsoDateEs('1988-04-12')).toBe('12/04/1988');
    expect(toIsoDate(parseIsoDate('1988-04-12') as Date)).toBe('1988-04-12');
    expect(parseIsoDate('32/04/1988')).toBeNull();
  });

  it('abre el calendario propio y selecciona un día', () => {
    const fixture = TestBed.createComponent(UiDatePicker);
    const field = new FormControl('1988-04-12', { nonNullable: true });
    fixture.componentRef.setInput('id', 'birth');
    fixture.componentRef.setInput('label', 'Fecha de nacimiento');
    fixture.componentRef.setInput('field', field);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('input[type="date"]')).toBeNull();
    expect(root.textContent).toContain('12/04/1988');

    (root.querySelector('.dp__trigger') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(root.textContent).toContain('Abril de 1988');
    expect(root.textContent).toContain('LU');
    expect(root.querySelector('.dp__day--on')?.textContent?.trim()).toBe('12');

    const day = [...root.querySelectorAll('.dp__day')].find((node) => node.textContent?.trim() === '20') as
      | HTMLButtonElement
      | undefined;
    day?.click();
    fixture.detectChanges();

    expect(field.value).toBe('1988-04-20');
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('borra la fecha desde el pie del calendario', () => {
    const fixture = TestBed.createComponent(UiDatePicker);
    const field = new FormControl('1988-04-12', { nonNullable: true });
    fixture.componentRef.setInput('id', 'birth');
    fixture.componentRef.setInput('label', 'Fecha de nacimiento');
    fixture.componentRef.setInput('field', field);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector('.dp__trigger')?.dispatchEvent(new Event('click'));
    fixture.detectChanges();
    fixture.componentInstance.clear();
    expect(field.value).toBe('');
  });
});
