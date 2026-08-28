import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ListSpecialties, ListUserRoles, UpdateSpecialty, UpdateUserRole } from '@core/application';
import { matchesAdminSearch, statusLabel } from '@core/domain/services/admin-catalog';
import type { EntityStatus, SpecialtyEntity, UserRoleEntity } from '@core/domain/entities';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { Icon } from '@shared/components/icon/icon';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import { UiTable, type UiTableColumn, type UiTableRow } from '@shared/components/ui-table/ui-table';
import type { ChoiceOption } from '@shared/models/choice.model';
import { ItemQuickCreate } from './item-quick-create';
import type { CatalogKind } from './catalog-form';

export type { CatalogKind };

@Component({
  selector: 'app-items-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Button, Icon, UiSelect, UiTable, ItemQuickCreate],
  templateUrl: './items-list.page.html',
  styleUrl: './items-list.page.scss',
})
export class ItemsListPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly listRoles = inject(ListUserRoles);
  private readonly listSpecialties = inject(ListSpecialties);
  private readonly updateRole = inject(UpdateUserRole);
  private readonly updateSpecialty = inject(UpdateSpecialty);

  readonly kind = (this.route.snapshot.data['catalog'] as CatalogKind) ?? 'roles';
  readonly isRoles = this.kind === 'roles';
  readonly items = signal<(UserRoleEntity | SpecialtyEntity)[]>([]);
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly query = signal('');
  readonly statusFilter = signal<'all' | EntityStatus>('all');
  readonly selectedId = signal<string | null>(null);
  readonly createOpen = signal(false);
  readonly notice = signal<string | null>(
    (this.router.currentNavigation()?.extras.state?.['notice'] as string | undefined) ??
      (history.state?.['notice'] as string | undefined) ??
      null,
  );
  readonly title = this.isRoles ? 'Roles de usuario' : 'Especialidades';
  readonly lead = this.isRoles
    ? 'Catálogo de roles: administrador, dirección académica, instrucción y alumnado.'
    : 'Catálogo de especialidades que se pueden asignar a cada persona.';
  readonly editBase = this.isRoles ? '/catalogo/roles' : '/catalogo/especialidades';

  readonly statusOptions: ChoiceOption[] = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' },
  ];

  readonly columns: UiTableColumn[] = [
    { id: 'name', header: this.isRoles ? 'Nombre del rol' : 'Nombre' },
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
    this.reload();
  }

  onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.selectedId.set(null);
  }

  openCreate(): void {
    this.createOpen.set(true);
  }

  closeCreate(): void {
    this.createOpen.set(false);
  }

  onCreated(): void {
    this.createOpen.set(false);
    this.notice.set(this.isRoles ? 'Rol creado.' : 'Especialidad creada.');
    this.reload();
  }

  goSelected(): void {
    const id = this.selectedId();
    if (id) void this.router.navigate([this.editBase, id]);
  }

  deactivateSelected(): void {
    const item = this.items().find((entry) => entry.id === this.selectedId());
    if (!item) return;
    const stream = this.isRoles
      ? this.updateRole.execute(item.id, { name: item.name, description: item.description, status: 'inactive' })
      : this.updateSpecialty.execute(item.id, { name: item.name, description: item.description, status: 'inactive' });
    stream.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.notice.set('El registro ha pasado a baja.');
        this.selectedId.set(null);
        this.reload();
      },
    });
  }

  private reload(): void {
    const stream = this.isRoles ? this.listRoles.execute() : this.listSpecialties.execute();
    stream.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => {
        this.items.set(items);
        this.loadState.set('ready');
      },
      error: () => this.loadState.set('error'),
    });
  }
}
