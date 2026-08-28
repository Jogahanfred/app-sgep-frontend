import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ListAdminUsers } from '@core/application';
import { matchesAdminSearch, statusLabel } from '@core/domain/services/admin-catalog';
import type { EntityStatus, UserEntity } from '@core/domain/entities';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { Icon } from '@shared/components/icon/icon';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import { UiTable, type UiTableColumn, type UiTableRow } from '@shared/components/ui-table/ui-table';
import type { ChoiceOption } from '@shared/models/choice.model';

@Component({
  selector: 'app-users-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Button, Icon, UiSelect, UiTable],
  templateUrl: './users-list.page.html',
  styleUrl: './users-list.page.scss',
})
export class UsersListPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly listUsers = inject(ListAdminUsers);
  private readonly router = inject(Router);

  readonly users = signal<UserEntity[]>([]);
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly query = signal('');
  readonly statusFilter = signal<'all' | EntityStatus>('all');
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
    { id: 'action', header: '', align: 'right' },
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
        action: { text: 'Editar', href: `/catalogo/usuarios/${user.id}` },
      },
    })),
  );

  constructor() {
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

  formatDate(value: string): string {
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return value;
    return `${day}/${month}/${year}`;
  }

  onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }
}
