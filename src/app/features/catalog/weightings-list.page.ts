import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ListSquadrons, ListStandards, ListUnits, ListWeightings } from '@core/application';
import { matchesAdminSearch, weightingIsCurrent } from '@core/domain/services/admin-catalog';
import type { SquadronEntity, StandardEntity, StandardWeightingEntity, UnitEntity } from '@core/domain/entities';
import { forkJoin } from 'rxjs';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiTable, type UiTableColumn, type UiTableRow } from '@shared/components/ui-table/ui-table';

@Component({
  selector: 'app-weightings-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Button, UiInput, UiTable],
  templateUrl: './weightings-list.page.html',
  styleUrl: './weightings-list.page.scss',
})
export class WeightingsListPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly listWeightings = inject(ListWeightings);
  private readonly listStandards = inject(ListStandards);
  private readonly listUnits = inject(ListUnits);
  private readonly listSquadrons = inject(ListSquadrons);

  readonly items = signal<StandardWeightingEntity[]>([]);
  readonly standards = signal<StandardEntity[]>([]);
  readonly units = signal<UnitEntity[]>([]);
  readonly squadrons = signal<SquadronEntity[]>([]);
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly search = new FormControl('', { nonNullable: true });
  readonly query = signal('');
  readonly selectedId = signal<string | null>(null);
  readonly createHref = '/catalogo/ponderaciones/nuevo';

  readonly columns: UiTableColumn[] = [
    { id: 'standard', header: 'Estándar' },
    { id: 'unit', header: 'Unidad' },
    { id: 'squadron', header: 'Escuadrón' },
    { id: 'program', header: 'Programa' },
    { id: 'value', header: 'Valor ponderado' },
    { id: 'validity', header: 'Vigencia' },
  ];

  readonly filtered = computed(() =>
    this.items().filter((item) =>
      matchesAdminSearch(
        [
          this.standardName(item.standardId),
          this.unitName(item.unitId),
          this.squadronName(item.squadronId),
          item.program,
          String(item.weightedValue),
        ],
        this.query(),
      ),
    ),
  );

  readonly tableRows = computed<UiTableRow[]>(() =>
    this.filtered().map((item) => ({
      id: item.id,
      cells: {
        standard: this.standardName(item.standardId),
        unit: this.unitName(item.unitId),
        squadron: this.squadronName(item.squadronId),
        program: item.program,
        value: `${item.weightedValue}`,
        validity: {
          text: `${this.formatDate(item.validFrom)} — ${this.formatDate(item.validTo)}`,
          badge: weightingIsCurrent(item.validTo) ? 'active' : 'inactive',
        },
      },
    })),
  );

  constructor() {
    this.search.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.query.set(value);
      this.selectedId.set(null);
    });
    forkJoin({
      weightings: this.listWeightings.execute(),
      standards: this.listStandards.execute(),
      units: this.listUnits.execute(),
      squadrons: this.listSquadrons.execute(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ weightings, standards, units, squadrons }) => {
          this.items.set(weightings);
          this.standards.set(standards);
          this.units.set(units);
          this.squadrons.set(squadrons);
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
  }

  goDetail(): void {
    const id = this.selectedId();
    if (id) void this.router.navigate(['/catalogo/ponderaciones', id]);
  }

  goEdit(): void {
    const id = this.selectedId();
    if (id) void this.router.navigate(['/catalogo/ponderaciones', id, 'editar']);
  }

  private standardName(id: string): string {
    const item = this.standards().find((entry) => entry.id === id);
    return item ? `${item.code} · ${item.name}` : '—';
  }

  private unitName(id: string): string {
    const item = this.units().find((entry) => entry.id === id);
    return item ? `${item.abbreviation} · ${item.name}` : '—';
  }

  private squadronName(id: string): string {
    const item = this.squadrons().find((entry) => entry.id === id);
    return item ? item.name : '—';
  }

  private formatDate(value: string): string {
    const [year, month, day] = value.split('-');
    return year && month && day ? `${day}/${month}/${year}` : value;
  }
}
