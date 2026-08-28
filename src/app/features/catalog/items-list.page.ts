import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ListSpecialties, ListUserRoles } from '@core/application';
import { matchesAdminSearch, statusLabel } from '@core/domain/services/admin-catalog';
import type { EntityStatus, SpecialtyEntity, UserRoleEntity } from '@core/domain/entities';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { Icon } from '@shared/components/icon/icon';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import { UiTable, type UiTableColumn, type UiTableRow } from '@shared/components/ui-table/ui-table';
import type { ChoiceOption } from '@shared/models/choice.model';

export type CatalogKind = 'roles' | 'specialties';

@Component({
  selector: 'app-items-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Button, Icon, UiSelect, UiTable],
  templateUrl: './items-list.page.html',
  styleUrl: './items-list.page.scss',
})
export class ItemsListPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly listRoles = inject(ListUserRoles);
  private readonly listSpecialties = inject(ListSpecialties);

  readonly kind = (this.route.snapshot.data['catalog'] as CatalogKind) ?? 'roles';
  readonly isRoles = this.kind === 'roles';
  readonly items = signal<(UserRoleEntity | SpecialtyEntity)[]>([]);
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly query = signal('');
  readonly statusFilter = signal<'all' | EntityStatus>('all');
  readonly notice = signal<string | null>(
    (this.router.currentNavigation()?.extras.state?.['notice'] as string | undefined) ??
      (history.state?.['notice'] as string | undefined) ??
      null,
  );
  readonly title = this.isRoles ? 'Roles de usuario' : 'Especialidades';
  readonly lead = this.isRoles
    ? 'Catálogo de roles: administrador, dirección académica, instrucción y alumnado.'
    : 'Catálogo de especialidades que se pueden asignar a cada persona.';
  readonly createLabel = this.isRoles ? 'Nuevo rol' : 'Nueva especialidad';
  readonly nameLabel = this.isRoles ? 'Nombre del rol' : 'Nombre';
  readonly createHref = this.isRoles ? '/catalogo/roles/nuevo' : '/catalogo/especialidades/nuevo';
  readonly editBase = this.isRoles ? '/catalogo/roles' : '/catalogo/especialidades';

  readonly statusOptions: ChoiceOption[] = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' },
  ];

  readonly columns: UiTableColumn[] = [
    { id: 'name', header: this.nameLabel },
    { id: 'description', header: 'Descripción' },
    { id: 'status', header: 'Estado' },
    { id: 'action', header: '', align: 'right' },
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
        action: { text: 'Editar', href: `${this.editBase}/${item.id}` },
      },
    })),
  );

  constructor() {
    const stream = this.isRoles ? this.listRoles.execute() : this.listSpecialties.execute();
    stream.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => {
        this.items.set(items);
        this.loadState.set('ready');
      },
      error: () => this.loadState.set('error'),
    });
  }

  onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }
}
