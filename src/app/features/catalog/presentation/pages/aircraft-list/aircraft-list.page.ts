import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ListAircraft, ListFleets, ListUnits, UpdateAircraft } from '@core/application';
import { matchesAdminSearch, operationalLabel, statusLabel } from '@core/domain/services/admin-catalog';
import type { AircraftEntity, FleetEntity, UnitEntity } from '@core/domain/entities';
import { forkJoin } from 'rxjs';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { UiConfirmDialog } from '@shared/components/ui-confirm-dialog/ui-confirm-dialog';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import { UiTable, type UiTableColumn, type UiTableRow } from '@shared/components/ui-table/ui-table';
import type { ChoiceOption } from '@shared/models/choice.model';
import { operationalOptions } from '../../shared/forms/catalog-form';

@Component({
  selector: 'app-aircraft-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Button, UiConfirmDialog, UiInput, UiSelect, UiTable],
  templateUrl: './aircraft-list.page.html',
  styleUrl: './aircraft-list.page.scss',
})
export class AircraftListPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly listAircraft = inject(ListAircraft);
  private readonly listFleets = inject(ListFleets);
  private readonly listUnits = inject(ListUnits);
  private readonly updateAircraft = inject(UpdateAircraft);
  private readonly toast = inject(ToastService);

  readonly items = signal<AircraftEntity[]>([]);
  readonly fleets = signal<FleetEntity[]>([]);
  readonly units = signal<UnitEntity[]>([]);
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly search = new FormControl('', { nonNullable: true });
  readonly query = signal('');
  readonly unitFilter = signal('all');
  readonly fleetFilter = signal('all');
  readonly operationalFilter = signal<'all' | 'yes' | 'no'>('all');
  readonly selectedId = signal<string | null>(null);
  readonly confirmOpen = signal(false);
  readonly confirmName = signal('');
  readonly confirmMessage = computed(() => `¿Seguro que quieres dar de baja la aeronave «${this.confirmName()}»?`);
  readonly createHref = '/catalogo/aeronaves/nuevo';
  readonly operationalOptions = operationalOptions;

  readonly unitOptions = computed<ChoiceOption[]>(() => [
    { value: 'all', label: 'Todas' },
    ...this.units().map((unit) => ({ value: unit.id, label: `${unit.abbreviation} · ${unit.name}` })),
  ]);

  readonly fleetOptions = computed<ChoiceOption[]>(() => [
    { value: 'all', label: 'Todas' },
    ...this.fleets().map((fleet) => ({ value: fleet.id, label: `${fleet.code} · ${fleet.name}` })),
  ]);

  readonly columns: UiTableColumn[] = [
    { id: 'registration', header: 'Matrícula', align: 'left' },
    { id: 'fleet', header: 'Flota' },
    { id: 'unit', header: 'Unidad' },
    { id: 'operational', header: 'Operativa' },
    { id: 'status', header: 'Estado' },
  ];

  readonly filtered = computed(() => {
    const needle = this.query();
    const unitId = this.unitFilter();
    const fleetId = this.fleetFilter();
    const operational = this.operationalFilter();
    return this.items().filter((item) => {
      if (unitId !== 'all' && item.unitId !== unitId) return false;
      if (fleetId !== 'all' && item.fleetId !== fleetId) return false;
      if (operational === 'yes' && !item.operational) return false;
      if (operational === 'no' && item.operational) return false;
      return matchesAdminSearch(
        [item.registration, this.fleetName(item.fleetId), this.unitName(item.unitId), operationalLabel(item.operational)],
        needle,
      );
    });
  });

  readonly selected = computed(() => this.items().find((item) => item.id === this.selectedId()) ?? null);

  readonly tableRows = computed<UiTableRow[]>(() =>
    this.filtered().map((item) => ({
      id: item.id,
      cells: {
        registration: {
          text: item.registration,
          image: item.imageUrl,
          imageAlt: `Aeronave ${item.registration}`,
        },
        fleet: this.fleetName(item.fleetId),
        unit: this.unitName(item.unitId),
        operational: { text: operationalLabel(item.operational), badge: item.operational ? 'active' : 'inactive' },
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

  selectAircraft(id: string): void {
    this.selectedId.set(this.selectedId() === id ? null : id);
  }

  goDetail(): void {
    const id = this.selectedId();
    if (id) void this.router.navigate(['/catalogo/aeronaves', id]);
  }

  goEdit(): void {
    const id = this.selectedId();
    if (id) void this.router.navigate(['/catalogo/aeronaves', id, 'editar']);
  }

  askDeactivate(): void {
    const item = this.items().find((entry) => entry.id === this.selectedId());
    if (!item) return;
    this.confirmName.set(item.registration);
    this.confirmOpen.set(true);
  }

  closeConfirm(): void {
    this.confirmOpen.set(false);
  }

  confirmDeactivate(): void {
    this.confirmOpen.set(false);
    const item = this.items().find((entry) => entry.id === this.selectedId());
    if (!item) return;
    this.updateAircraft
      .execute(item.id, {
        unitId: item.unitId,
        fleetId: item.fleetId,
        registration: item.registration,
        operational: item.operational,
        status: 'inactive',
        imageUrl: item.imageUrl,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Baja realizada', 'La aeronave ha pasado a baja.');
          this.selectedId.set(null);
          this.reload();
        },
        error: () => this.toast.error('No se pudo dar de baja', 'No hemos podido dar de baja la aeronave.'),
      });
  }

  fleetName(id: string): string {
    const item = this.fleets().find((entry) => entry.id === id);
    return item ? `${item.code} · ${item.name}` : '—';
  }

  unitName(id: string): string {
    const item = this.units().find((entry) => entry.id === id);
    return item ? `${item.abbreviation} · ${item.name}` : '—';
  }

  onOperationalFilter(value: string): void {
    this.operationalFilter.set(value === 'yes' || value === 'no' ? value : 'all');
    this.selectedId.set(null);
  }

  private reload(): void {
    forkJoin({
      aircraft: this.listAircraft.execute(),
      fleets: this.listFleets.execute(),
      units: this.listUnits.execute(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ aircraft, fleets, units }) => {
          this.items.set(aircraft);
          this.fleets.set(fleets);
          this.units.set(units);
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
  }
}
