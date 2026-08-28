import { describe, expect, it } from 'vitest';
import { InvalidLoanInputError } from '../../domain/errors/domain-error';
import { CalculateLoanInstallment } from './calculate-loan-installment';

describe('CalculateLoanInstallment', () => {
  const useCase = new CalculateLoanInstallment();

  it('delega el cálculo al servicio de dominio', () => {
    const result = useCase.execute({
      amount: 10_000,
      termMonths: 12,
      annualInterestRate: 0,
    });

    expect(result.monthlyPayment).toBeCloseTo(833.33, 2);
  });

  it('propaga errores de validación del dominio', () => {
    expect(() =>
      useCase.execute({
        amount: 80_000,
        termMonths: 12,
        annualInterestRate: 5,
      }),
    ).toThrow(InvalidLoanInputError);
  });
});
