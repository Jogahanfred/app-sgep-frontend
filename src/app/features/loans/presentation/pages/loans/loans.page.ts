import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { GetLoans, mapLoanToProduct } from '@core/application';
import type { Product } from '@core/domain/entities';
import { ProductCatalog } from '@shared/components/product-catalog/product-catalog';
import { LoanCalculator } from '../../components/loan-calculator/loan-calculator';

@Component({
  selector: 'app-loans-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProductCatalog, LoanCalculator],
  template: `
    <app-product-catalog
      crumb="Préstamos"
      eyebrow="Financiación personal"
      title="Una cuota clara antes de pedirlo."
      subtitle="Impulso, movilidad o reforma. El cálculo usa el caso de uso CalculateLoanInstallment, no la plantilla."
      primaryLabel="Calcular cuota"
      primaryHref="/prestamos#simulador"
      listTitle="Préstamos disponibles"
      [products]="products()"
      [status]="status()"
    >
      <div id="simulador">
        <app-loan-calculator />
      </div>
    </app-product-catalog>
  `,
})
export class LoansPage {
  private readonly getLoans = inject(GetLoans);
  readonly products = signal<Product[]>([]);
  readonly status = signal<'loading' | 'ready' | 'error'>('loading');

  constructor() {
    this.getLoans
      .execute()
      .pipe(
        map((loans) => loans.map(mapLoanToProduct)),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe({
        next: (items) => {
          this.products.set(items);
          this.status.set('ready');
        },
        error: () => this.status.set('error'),
      });
  }
}
