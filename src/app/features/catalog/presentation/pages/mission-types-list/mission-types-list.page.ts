import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ListMissionTypes } from '@core/application';
import { matchesAdminSearch } from '@core/domain/services/admin-catalog';
import type { MissionTypeEntity } from '@core/domain/entities';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiTable, type UiTableColumn, type UiTableRow } from '@shared/components/ui-table/ui-table';

@Component({
  selector: 'app-mission-types-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Button, UiInput, UiTable],
  templateUrl: './mission-types-list.page.html',
  styleUrl: './mission-types-list.page.scss',
})
export class MissionTypesListPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly listMissionTypes = inject(ListMissionTypes);

  readonly items = signal<MissionTypeEntity[]>([]);
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly search = new FormControl('', { nonNullable: true });
  readonly query = signal('');
  readonly selectedId = signal<string | null>(null);
  readonly createHref = '/catalogo/tipos-de-mision/nuevo';

  readonly columns: UiTableColumn[] = [
    { id: 'code', header: 'Código' },
    { id: 'name', header: 'Nombre' },
    { id: 'description', header: 'Descripción' },
  ];

  readonly filtered = computed(() =>
    this.items().filter((item) => matchesAdminSearch([item.code, item.name, item.description], this.query())),
  );

  readonly tableRows = computed<UiTableRow[]>(() =>
    this.filtered().map((item) => ({
      id: item.id,
      cells: { code: item.code, name: item.name, description: item.description || '—' },
    })),
  );

  constructor() {
    this.search.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.query.set(value);
      this.selectedId.set(null);
    });
    this.listMissionTypes.execute().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => {
        this.items.set(items);
        this.loadState.set('ready');
      },
      error: () => this.loadState.set('error'),
    });
  }

  goDetail(): void {
    const id = this.selectedId();
    if (id) void this.router.navigate(['/catalogo/tipos-de-mision', id]);
  }

  goEdit(): void {
    const id = this.selectedId();
    if (id) void this.router.navigate(['/catalogo/tipos-de-mision', id, 'editar']);
  }
}
