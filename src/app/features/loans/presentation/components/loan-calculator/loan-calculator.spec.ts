import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CalculateLoanInstallment } from '@core/application';
import { LoanCalculator } from './loan-calculator';

describe('LoanCalculator', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoanCalculator],
      providers: [
        provideRouter([]),
        { provide: CalculateLoanInstallment, useFactory: () => new CalculateLoanInstallment() },
      ],
    }).compileComponents();
  });

  it('muestra la cuota estimada tras calcular', async () => {
    const fixture = TestBed.createComponent(LoanCalculator);
    const component = fixture.componentInstance;
    component.form.setValue({ amount: 12_000, termMonths: 24 });
    component.onSubmit();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.result()?.monthlyPayment).toBeCloseTo(536.73, 2);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Cuota mensual');
  });

  it('no calcula si el formulario es inválido', async () => {
    const fixture = TestBed.createComponent(LoanCalculator);
    const component = fixture.componentInstance;
    component.form.setValue({ amount: 10, termMonths: 24 });
    component.onSubmit();
    expect(component.result()).toBeNull();
    expect(component.amountError()).toBeTruthy();
  });
});
