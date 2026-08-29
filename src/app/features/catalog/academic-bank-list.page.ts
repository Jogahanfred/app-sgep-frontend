import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ListPhaseBanks, ListSubphaseBanks } from '@core/application';
import { matchesAdminSearch, statusLabel } from '@core/domain/services/admin-catalog';
import type { PhaseBankEntity, SubphaseBankEntity } from '@core/domain/entities';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiTable, type UiTableColumn, type UiTableRow } from '@shared/components/ui-table/ui-table';

export type AcademicBankKind = 'phase' | 'subphase';

@Component({
  selector: 'app-academic-bank-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Button, UiInput, UiTable],
  templateUrl: './academic-bank-list.page.html',
  styleUrl: './academic-bank-list.page.scss',
})
export class AcademicBankListPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly listPhaseBanks = inject(ListPhaseBanks);
  private readonly listSubphaseBanks = inject(ListSubphaseBanks);

  readonly kind = (this.route.snapshot.data['bank'] as AcademicBankKind) ?? 'phase';
  readonly isPhase = this.kind === 'phase';
  readonly items = signal<(PhaseBankEntity | SubphaseBankEntity)[]>([]);
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly search = new FormControl('', { nonNullable: true });
  readonly query = signal('');
  readonly selectedId = signal<string | null>(null);
  readonly listHref = this.isPhase ? '/catalogo/banco-fases' : '/catalogo/banco-subfases';
  readonly createHref = `${this.listHref}/nuevo`;
  readonly heading = this.isPhase ? 'Banco de fases' : 'Banco de subfases';
  readonly lead = this.isPhase
    ? 'Catálogo maestro de fases. Aquí se crea y edita el banco; el programa solo lo asigna al itinerario.'
    : 'Catálogo maestro de subfases. Aquí se crea y edita el banco; el programa solo lo asigna a cada lección.';

  readonly columns: UiTableColumn[] = [
    { id: 'code', header: 'Código' },
    { id: 'name', header: 'Nombre' },
    { id: 'description', header: 'Descripción' },
    { id: 'status', header: 'Estado' },
  ];

  readonly filtered = computed(() =>
    this.items().filter((item) => matchesAdminSearch([item.code, item.name, item.description], this.query())),
  );

  readonly tableRows = computed<UiTableRow[]>(() =>
    this.filtered().map((item) => ({
      id: item.id,
      cells: {
        code: item.code,
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
    const stream = this.isPhase ? this.listPhaseBanks.execute() : this.listSubphaseBanks.execute();
    stream.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => {
        this.items.set(items);
        this.loadState.set('ready');
      },
      error: () => this.loadState.set('error'),
    });
  }

  goDetail(): void {
    const id = this.selectedId();
    if (id) void this.router.navigate([this.listHref, id]);
  }

  goEdit(): void {
    const id = this.selectedId();
    if (id) void this.router.navigate([this.listHref, id, 'editar']);
  }
}
