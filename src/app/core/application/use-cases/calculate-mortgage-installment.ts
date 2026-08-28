import { calculateMortgageAmortization } from '../../domain/services/loan-calculator';
import type { LoanCalculationInput, LoanInstallment } from '../../domain/entities';

export class CalculateMortgageInstallment {
  execute(input: LoanCalculationInput): LoanInstallment {
    return calculateMortgageAmortization(input);
  }
}
