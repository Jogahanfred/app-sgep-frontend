import { describe, expect, it } from 'vitest';
import { InvalidLoanInputError } from '../errors/domain-error';
import { annualNominalToTae, calculateFrenchAmortization, calculateMortgageAmortization } from './loan-calculator';

describe('calculateFrenchAmortization', () => {
  it('calcula la cuota francesa de un préstamo con interés', () => {
    const result = calculateFrenchAmortization({
      amount: 20_000,
      termMonths: 60,
      annualInterestRate: 6.9,
    });

    expect(result.monthlyPayment).toBeCloseTo(395.08, 2);
    expect(result.totalCost).toBeCloseTo(23_704.8, 2);
    expect(result.totalInterest).toBeCloseTo(3_704.8, 2);
  });

  it('divide el capital en plazos iguales cuando el interés es 0', () => {
    const result = calculateFrenchAmortization({
      amount: 12_000,
      termMonths: 24,
      annualInterestRate: 0,
    });

    expect(result.monthlyPayment).toBe(500);
    expect(result.totalInterest).toBe(0);
    expect(result.totalCost).toBe(12_000);
  });

  it('rechaza un importe fuera de rango', () => {
    expect(() =>
      calculateFrenchAmortization({
        amount: 100,
        termMonths: 24,
        annualInterestRate: 5,
      }),
    ).toThrow(InvalidLoanInputError);
  });

  it('convierte TIN a TAE sin comisiones', () => {
    expect(annualNominalToTae(6.9)).toBeCloseTo(7.12, 2);
  });

  it('calcula una hipoteca fuera del rango de préstamo personal', () => {
    const result = calculateMortgageAmortization({
      amount: 250_000,
      termMonths: 300,
      annualInterestRate: 2.75,
    });

    expect(result.monthlyPayment).toBeGreaterThan(1000);
    expect(result.totalCost).toBeGreaterThan(250_000);
  });

  it('rechaza un plazo no entero', () => {
    expect(() =>
      calculateFrenchAmortization({
        amount: 5_000,
        termMonths: 18.5,
        annualInterestRate: 5,
      }),
    ).toThrow(InvalidLoanInputError);
  });
});
