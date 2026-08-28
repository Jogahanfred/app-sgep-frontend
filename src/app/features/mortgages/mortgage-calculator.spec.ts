import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CalculateMortgageInstallment } from '@core/application';
import { MortgageCalculator } from './mortgage-calculator';

describe('MortgageCalculator', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MortgageCalculator],
      providers: [
        provideRouter([]),
        { provide: CalculateMortgageInstallment, useFactory: () => new CalculateMortgageInstallment() },
      ],
    }).compileComponents();
  });

  it('muestra la cuota mensual de ejemplo', async () => {
    const fixture = TestBed.createComponent(MortgageCalculator);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.result()?.monthlyPayment).toBeGreaterThan(0);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Cuota mensual');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sí, la tengo elegida y reservada.');
  });
});
