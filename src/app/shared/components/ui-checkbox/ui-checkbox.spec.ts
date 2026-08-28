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
});
