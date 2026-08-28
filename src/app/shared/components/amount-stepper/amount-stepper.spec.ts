import { TestBed } from '@angular/core/testing';
import { AmountStepper } from './amount-stepper';

describe('AmountStepper', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AmountStepper],
    }).compileComponents();
  });

  it('suma y resta el paso sin salir del rango', () => {
    const fixture = TestBed.createComponent(AmountStepper);
    const emitted: number[] = [];
    fixture.componentRef.setInput('id', 'price');
    fixture.componentRef.setInput('value', 250_000);
    fixture.componentRef.setInput('min', 50_000);
    fixture.componentRef.setInput('max', 260_000);
    fixture.componentRef.setInput('step', 10_000);
    fixture.componentInstance.valueChange.subscribe((value) => emitted.push(value));
    fixture.detectChanges();

    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('button');
    buttons[1].click();
    buttons[0].click();
    expect(emitted).toEqual([260_000, 240_000]);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('250.000 €');
  });
});
