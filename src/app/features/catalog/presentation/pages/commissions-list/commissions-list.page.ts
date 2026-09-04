import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ListAdminUsers, ListTemporaryCommissions, ListUnits, UpdateTemporaryCommission } from '@core/application';
import { commissionStatusLabel, matchesAdminSearch } from '@core/domain/services/admin-catalog';
import type {
  CommissionWorkflowStatus,
  TemporaryCommissionEntity,
  UnitEntity,
  UserEntity,
} from '@core/domain/entities';
import { forkJoin } from 'rxjs';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { UiConfirmDialog } from '@shared/components/ui-confirm-dialog/ui-confirm-dialog';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import { UiTable, type UiTableColumn, type UiTableRow } from '@shared/components/ui-table/ui-table';
import type { ChoiceOption } from '@shared/models/choice.model';

@Component({
  selector: 'app-commissions-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Button, UiConfirmDialog, UiInput, UiSelect, UiTable],
  templateUrl: './commissions-list.page.html',
  styleUrl: './commissions-list.page.scss',
})
export class CommissionsListPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly listCommissions = inject(ListTemporaryCommissions);
  private readonly listUsers = inject(ListAdminUsers);
  private readonly listUnits = inject(ListUnits);
  private readonly updateCommission = inject(UpdateTemporaryCommission);
  private readonly toast = inject(ToastService);

  readonly items = signal<TemporaryCommissionEntity[]>([]);
  readonly users = signal<UserEntity[]>([]);
  readonly units = signal<UnitEntity[]>([]);
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly search = new FormControl('', { nonNullable: true });
  readonly query = signal('');
  readonly statusFilter = signal<'all' | CommissionWorkflowStatus>('all');
  readonly selectedId = signal<string | null>(null);
  readonly confirmOpen = signal(false);
  readonly confirmName = signal('');
  readonly confirmMessage = computed(
    () => `¿Seguro que quieres finalizar la comisión de «${this.confirmName()}»?`,
  );
  readonly createHref = '/catalogo/comisiones-temporales/nuevo';

  readonly statusOptions: ChoiceOption[] = [
    { value: 'all', label: 'Todos' },
    { value: 'registered', label: 'Registrado' },
    { value: 'approved', label: 'Aprobado' },
    { value: 'active', label: 'Activo' },
    { value: 'finished', label: 'Finalizado' },
  ];

  readonly columns: UiTableColumn[] = [
    { id: 'user', header: 'Usuario' },
    { id: 'origin', header: 'Unidad origen' },
    { id: 'destination', header: 'Unidad destino' },
    { id: 'dates', header: 'Periodo' },
    { id: 'status', header: 'Estado' },
  ];

  readonly filtered = computed(() => {
    const needle = this.query();
    const status = this.statusFilter();
    return this.items().filter((item) => {
      if (status !== 'all' && item.status !== status) return false;
      return matchesAdminSearch(
        [this.userName(item.userId), this.unitName(item.originUnitId), this.unitName(item.destinationUnitId), item.reason],
        needle,
      );
    });
  });

  readonly tableRows = computed<UiTableRow[]>(() =>
    this.filtered().map((item) => ({
      id: item.id,
      cells: {
        user: this.userName(item.userId),
        origin: this.unitName(item.originUnitId),
        destination: this.unitName(item.destinationUnitId),
        dates: `${this.formatDate(item.startDate)} — ${this.formatDate(item.endDate)}`,
        status: { text: commissionStatusLabel(item.status), badge: item.status },
      },
    })),
  );

  readonly canFinish = computed(() => {
    const item = this.items().find((entry) => entry.id === this.selectedId());
    return !!item && item.status !== 'finished';
  });

  constructor() {
    this.search.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.query.set(value);
      this.selectedId.set(null);
    });
    this.reload();
  }

  goDetail(): void {
    const id = this.selectedId();
    if (id) void this.router.navigate(['/catalogo/comisiones-temporales', id]);
  }

  goEdit(): void {
    const id = this.selectedId();
    if (id) void this.router.navigate(['/catalogo/comisiones-temporales', id, 'editar']);
  }

  askFinish(): void {
    const item = this.items().find((entry) => entry.id === this.selectedId());
    if (!item || item.status === 'finished') return;
    this.confirmName.set(this.userName(item.userId));
    this.confirmOpen.set(true);
  }

  closeConfirm(): void {
    this.confirmOpen.set(false);
  }

  confirmFinish(): void {
    this.confirmOpen.set(false);
    const item = this.items().find((entry) => entry.id === this.selectedId());
    if (!item) return;
    this.updateCommission
      .execute(item.id, {
        userId: item.userId,
        originUnitId: item.originUnitId,
        destinationUnitId: item.destinationUnitId,
        startDate: item.startDate,
        endDate: item.endDate,
        reason: item.reason,
        status: 'finished',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Comisión finalizada', 'El personal vuelve a su unidad de origen.');
          this.selectedId.set(null);
          this.reload();
        },
        error: () => this.toast.error('No se pudo finalizar', 'No hemos podido cerrar la comisión.'),
      });
  }

  onStatusFilter(value: string): void {
    if (value === 'registered' || value === 'approved' || value === 'active' || value === 'finished') {
      this.statusFilter.set(value);
      return;
    }
    this.statusFilter.set('all');
  }

  private userName(id: string): string {
    const user = this.users().find((entry) => entry.id === id);
    return user ? `${user.firstName} ${user.lastName}` : '—';
  }

  private unitName(id: string): string {
    const unit = this.units().find((entry) => entry.id === id);
    return unit ? `${unit.abbreviation} · ${unit.name}` : '—';
  }

  private formatDate(value: string): string {
    const [year, month, day] = value.split('-');
    return year && month && day ? `${day}/${month}/${year}` : value;
  }

  private reload(): void {
    forkJoin({
      commissions: this.listCommissions.execute(),
      users: this.listUsers.execute(),
      units: this.listUnits.execute(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ commissions, users, units }) => {
          this.items.set(commissions);
          this.users.set(users);
          this.units.set(units);
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
  }
}
