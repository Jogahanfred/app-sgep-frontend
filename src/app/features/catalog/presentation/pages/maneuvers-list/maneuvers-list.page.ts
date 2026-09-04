import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ListManeuvers, ListOperations } from '@core/application';
import { matchesAdminSearch } from '@core/domain/services/admin-catalog';
import type { ManeuverBankEntity, OperationEntity } from '@core/domain/entities';
import { forkJoin } from 'rxjs';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiTable, type UiTableColumn, type UiTableRow } from '@shared/components/ui-table/ui-table';

@Component({
  selector: 'app-maneuvers-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Button, UiInput, UiTable],
  templateUrl: './maneuvers-list.page.html',
  styleUrl: './maneuvers-list.page.scss',
})
export class ManeuversListPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly listManeuvers = inject(ListManeuvers);
  private readonly listOperations = inject(ListOperations);

  readonly items = signal<ManeuverBankEntity[]>([]);
  readonly operations = signal<OperationEntity[]>([]);
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly search = new FormControl('', { nonNullable: true });
  readonly query = signal('');
  readonly selectedId = signal<string | null>(null);
  readonly createHref = '/catalogo/maniobras/nuevo';

  readonly columns: UiTableColumn[] = [
    { id: 'operation', header: 'Operación' },
    { id: 'code', header: 'Código' },
    { id: 'name', header: 'Nombre' },
    { id: 'description', header: 'Descripción' },
  ];

  readonly filtered = computed(() =>
    this.items().filter((item) => {
      const operation = this.operations().find((entry) => entry.id === item.operationId);
      return matchesAdminSearch([item.code, item.name, item.description, operation?.name], this.query());
    }),
  );

  readonly tableRows = computed<UiTableRow[]>(() =>
    this.filtered().map((item) => {
      const operation = this.operations().find((entry) => entry.id === item.operationId);
      return {
        id: item.id,
        cells: {
          operation: operation?.name ?? '—',
          code: item.code,
          name: item.name,
          description: item.description || '—',
        },
      };
    }),
  );

  constructor() {
    this.search.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.query.set(value);
      this.selectedId.set(null);
    });
    forkJoin({ maneuvers: this.listManeuvers.execute(), operations: this.listOperations.execute() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ maneuvers, operations }) => {
          this.items.set(maneuvers);
          this.operations.set(operations);
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
  }

  goDetail(): void {
    const id = this.selectedId();
    if (id) void this.router.navigate(['/catalogo/maniobras', id]);
  }

  goEdit(): void {
    const id = this.selectedId();
    if (id) void this.router.navigate(['/catalogo/maniobras', id, 'editar']);
  }
}
