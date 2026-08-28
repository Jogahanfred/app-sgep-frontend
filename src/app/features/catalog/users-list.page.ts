import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ListAdminUsers, UpdateAdminUser } from '@core/application';
import { matchesAdminSearch, statusLabel } from '@core/domain/services/admin-catalog';
import type { EntityStatus, UserEntity } from '@core/domain/entities';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { Modal } from '@shared/components/modal/modal';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import { UiTable, type UiTableColumn, type UiTableRow } from '@shared/components/ui-table/ui-table';
import type { ChoiceOption } from '@shared/models/choice.model';

@Component({
  selector: 'app-users-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Button, Modal, UiInput, UiSelect, UiTable],
  templateUrl: './users-list.page.html',
  styleUrl: './users-list.page.scss',
})
export class UsersListPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly listUsers = inject(ListAdminUsers);
  private readonly updateUser = inject(UpdateAdminUser);
  private readonly router = inject(Router);

  readonly users = signal<UserEntity[]>([]);
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly search = new FormControl('', { nonNullable: true });
  readonly query = signal('');
  readonly statusFilter = signal<'all' | EntityStatus>('all');
  readonly selectedId = signal<string | null>(null);
  readonly confirmOpen = signal(false);
  readonly confirmName = signal('');
  readonly notice = signal<string | null>(
    (this.router.currentNavigation()?.extras.state?.['notice'] as string | undefined) ??
      (history.state?.['notice'] as string | undefined) ??
      null,
  );

  readonly statusOptions: ChoiceOption[] = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' },
  ];

  readonly columns: UiTableColumn[] = [
    { id: 'firstName', header: 'Nombres' },
    { id: 'lastName', header: 'Apellidos' },
    { id: 'email', header: 'Correo electrónico' },
    { id: 'document', header: 'DNI / Documento' },
    { id: 'entryDate', header: 'Fecha de ingreso' },
    { id: 'indicative', header: 'Indicativo' },
    { id: 'status', header: 'Estado' },
  ];

  readonly filtered = computed(() => {
    const needle = this.query();
    const status = this.statusFilter();
    return this.users().filter((user) => {
      if (status !== 'all' && user.status !== status) return false;
      return matchesAdminSearch(
        [user.firstName, user.lastName, user.email, user.documentNumber, user.indicative],
        needle,
      );
    });
  });

  readonly tableRows = computed<UiTableRow[]>(() =>
    this.filtered().map((user) => ({
      id: user.id,
      cells: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        document: user.documentNumber,
        entryDate: this.formatDate(user.entryDate),
        indicative: user.indicative || '—',
        status: { text: statusLabel(user.status), badge: user.status },
      },
    })),
  );

  readonly selectedHref = computed(() => {
    const id = this.selectedId();
    return id ? `/catalogo/usuarios/${id}` : undefined;
  });

  constructor() {
    this.search.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.query.set(value);
      this.selectedId.set(null);
    });
    this.reload();
  }

  formatDate(value: string): string {
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return value;
    return `${day}/${month}/${year}`;
  }

  goDetail(): void {
    const href = this.selectedHref();
    if (href) void this.router.navigateByUrl(href);
  }

  goEdit(): void {
    const href = this.selectedHref();
    if (href) void this.router.navigateByUrl(`${href}/editar`);
  }

  askDeactivate(): void {
    const user = this.users().find((item) => item.id === this.selectedId());
    if (!user) return;
    this.confirmName.set(`${user.firstName} ${user.lastName}`.trim());
    this.confirmOpen.set(true);
  }

  closeConfirm(): void {
    this.confirmOpen.set(false);
  }

  confirmDeactivate(): void {
    this.confirmOpen.set(false);
    this.deactivateSelected();
  }

  private deactivateSelected(): void {
    const user = this.users().find((item) => item.id === this.selectedId());
    if (!user) return;
    this.updateUser
      .execute(user.id, {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        documentNumber: user.documentNumber,
        entryDate: user.entryDate,
        indicative: user.indicative ?? '',
        status: 'inactive',
        roleIds: user.roleIds,
        specialtyIds: user.specialtyIds,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notice.set('La persona ha pasado a baja.');
          this.selectedId.set(null);
          this.reload();
        },
      });
  }

  private reload(): void {
    this.listUsers
      .execute()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (users) => {
          this.users.set(users);
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
  }
}
