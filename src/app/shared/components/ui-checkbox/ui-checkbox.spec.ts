import { TestBed } from '@angular/core/testing';
import { UiCheckbox } from './ui-checkbox';

describe('UiCheckbox', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiCheckbox],
    }).compileComponents();
  });

  it('emite el nuevo estado al marcar', () => {
    const fixture = TestBed.createComponent(UiCheckbox);
    const emitted: boolean[] = [];
    fixture.componentRef.setInput('id', 'nocard');
    fixture.componentRef.setInput('label', 'No tengo tarjeta');
    fixture.componentRef.setInput('checked', false);
    fixture.componentInstance.checkedChange.subscribe((value) => emitted.push(value));
    fixture.detectChanges();

    const input = (fixture.nativeElement as HTMLElement).querySelector('input') as HTMLInputElement;
    input.checked = true;
    input.dispatchEvent(new Event('change'));
    expect(emitted).toEqual([true]);
  });

  it('lanza la onda de agua al pulsar la fila', () => {
    const fixture = TestBed.createComponent(UiCheckbox);
    fixture.componentRef.setInput('id', 'ck-ripple');
    fixture.componentRef.setInput('label', 'Circuito');
    fixture.detectChanges();

    const row = (fixture.nativeElement as HTMLElement).querySelector('.ck') as HTMLElement;
    row.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 200, height: 40, right: 200, bottom: 40, x: 0, y: 0, toJSON: () => undefined }) as DOMRect;
    row.dispatchEvent(new PointerEvent('pointerdown', { button: 0, clientX: 30, clientY: 16, bubbles: true }));

    expect(row.querySelectorAll('.app-ripple, .app-ripple--wash').length).toBe(3);
  });

  it('usa el mismo alto que ui-input', () => {
    const fixture = TestBed.createComponent(UiCheckbox);
    fixture.componentRef.setInput('id', 'ck-size');
    fixture.componentRef.setInput('label', 'Despegue');
    fixture.detectChanges();

    const row = (fixture.nativeElement as HTMLElement).querySelector('.ck') as HTMLElement;
    const styles = getComputedStyle(row);
    expect(styles.height).toMatch(/2\.5rem|40px|control-height/);
    expect(styles.minHeight).toMatch(/2\.5rem|40px|control-height/);
  });
});
