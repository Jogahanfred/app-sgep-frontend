import { calculateFrenchAmortization } from '../../domain/services/loan-calculator';
import type { LoanCalculationInput, LoanInstallment } from '../../domain/entities';

export class CalculateLoanInstallment {
  execute(input: LoanCalculationInput): LoanInstallment {
    return calculateFrenchAmortization(input);
  }
}
