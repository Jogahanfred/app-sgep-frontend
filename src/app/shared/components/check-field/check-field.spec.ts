import { TestBed } from '@angular/core/testing';
import { CheckField } from './check-field';

describe('CheckField', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckField],
    }).compileComponents();
  });

  it('emite el nuevo estado al marcar', () => {
    const fixture = TestBed.createComponent(CheckField);
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
