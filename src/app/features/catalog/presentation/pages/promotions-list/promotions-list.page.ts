import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ListPromotions } from '@core/application';
import type { PromotionEntity } from '@core/domain/entities';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiTable, type UiTableColumn, type UiTableRow } from '@shared/components/ui-table/ui-table';

@Component({
  selector: 'app-promotions-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Button, UiInput, UiTable],
  templateUrl: './promotions-list.page.html',
  styleUrl: './promotions-list.page.scss',
})
export class PromotionsListPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly listPromotions = inject(ListPromotions);
  private readonly router = inject(Router);

  readonly promotions = signal<PromotionEntity[]>([]);
  readonly loading = signal(true);
  readonly search = new FormControl('', { nonNullable: true });
  readonly query = signal('');
  readonly selectedId = signal<string | null>(null);
  readonly columns: UiTableColumn[] = [
    { id: 'code', header: 'Código' },
    { id: 'name', header: 'Nombre' },
    { id: 'year', header: 'Año' },
    { id: 'period', header: 'Vigencia' },
  ];

  readonly filtered = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.promotions().filter((item) => !query || `${item.code} ${item.name} ${item.year}`.toLowerCase().includes(query));
  });

  readonly rows = computed<UiTableRow[]>(() => this.filtered().map((item) => ({
    id: item.id,
    cells: { code: item.code, name: item.name, year: String(item.year), period: `${this.formatDate(item.startDate)} - ${this.formatDate(item.endDate)}` },
  })));

  constructor() {
    this.search.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.query.set(value);
      this.selectedId.set(null);
    });
    this.listPromotions.execute().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => { this.promotions.set(items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  formatDate(value: string): string {
    const [year, month, day] = value.split('-');
    return year && month && day ? `${day}/${month}/${year}` : value;
  }

  detail(): void {
    const id = this.selectedId();
    if (id) void this.router.navigate(['/catalogo/promociones', id]);
  }

  edit(): void {
    const id = this.selectedId();
    if (id) void this.router.navigate(['/catalogo/promociones', id, 'editar']);
  }
}
