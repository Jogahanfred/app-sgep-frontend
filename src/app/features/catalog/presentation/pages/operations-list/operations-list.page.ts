import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ListOperations, UpdateOperation } from '@core/application';
import { matchesAdminSearch, statusLabel } from '@core/domain/services/admin-catalog';
import type { EntityStatus, OperationEntity } from '@core/domain/entities';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { UiConfirmDialog } from '@shared/components/ui-confirm-dialog/ui-confirm-dialog';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import { UiTable, type UiTableColumn, type UiTableRow } from '@shared/components/ui-table/ui-table';
import type { ChoiceOption } from '@shared/models/choice.model';

@Component({
  selector: 'app-operations-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Button, UiConfirmDialog, UiInput, UiSelect, UiTable],
  templateUrl: './operations-list.page.html',
  styleUrl: './operations-list.page.scss',
})
export class OperationsListPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly listOperations = inject(ListOperations);
  private readonly updateOperation = inject(UpdateOperation);
  private readonly toast = inject(ToastService);

  readonly items = signal<OperationEntity[]>([]);
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly search = new FormControl('', { nonNullable: true });
  readonly query = signal('');
  readonly statusFilter = signal<'all' | EntityStatus>('all');
  readonly selectedId = signal<string | null>(null);
  readonly confirmOpen = signal(false);
  readonly confirmName = signal('');
  readonly confirmMessage = computed(() => `¿Seguro que quieres dar de baja la operación «${this.confirmName()}»?`);
  readonly createHref = '/catalogo/operaciones/nuevo';

  readonly statusOptions: ChoiceOption[] = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' },
  ];

  readonly columns: UiTableColumn[] = [
    { id: 'name', header: 'Nombre' },
    { id: 'description', header: 'Descripción' },
    { id: 'status', header: 'Estado' },
  ];

  readonly filtered = computed(() => {
    const needle = this.query();
    const status = this.statusFilter();
    return this.items().filter((item) => {
      if (status !== 'all' && item.status !== status) return false;
      return matchesAdminSearch([item.name, item.description], needle);
    });
  });

  readonly tableRows = computed<UiTableRow[]>(() =>
    this.filtered().map((item) => ({
      id: item.id,
      cells: {
        name: item.name,
        description: item.description || '—',
        status: { text: statusLabel(item.status), badge: item.status },
      },
    })),
  );

  constructor() {
    this.search.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.query.set(value);
      this.selectedId.set(null);
    });
    this.reload();
  }

  goDetail(): void {
    const id = this.selectedId();
    if (id) void this.router.navigate(['/catalogo/operaciones', id]);
  }

  goEdit(): void {
    const id = this.selectedId();
    if (id) void this.router.navigate(['/catalogo/operaciones', id, 'editar']);
  }

  askDeactivate(): void {
    const item = this.items().find((entry) => entry.id === this.selectedId());
    if (!item) return;
    this.confirmName.set(item.name);
    this.confirmOpen.set(true);
  }

  closeConfirm(): void {
    this.confirmOpen.set(false);
  }

  confirmDeactivate(): void {
    this.confirmOpen.set(false);
    const item = this.items().find((entry) => entry.id === this.selectedId());
    if (!item) return;
    this.updateOperation
      .execute(item.id, { name: item.name, description: item.description, status: 'inactive' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Baja realizada', 'La operación ha pasado a baja.');
          this.selectedId.set(null);
          this.reload();
        },
        error: () => this.toast.error('No se pudo dar de baja', 'No hemos podido dar de baja la operación.'),
      });
  }

  private reload(): void {
    this.listOperations.execute().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => {
        this.items.set(items);
        this.loadState.set('ready');
      },
      error: () => this.loadState.set('error'),
    });
  }
}
