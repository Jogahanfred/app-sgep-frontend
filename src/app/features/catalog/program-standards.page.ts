import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AssignProgramStandards, ListPrograms, ListStandards } from '@core/application';
import { DomainError } from '@core/domain/errors/domain-error';
import type { ProgramEntity, StandardEntity } from '@core/domain/entities';
import { matchesAdminSearch } from '@core/domain/services/admin-catalog';
import { firstValueFrom, forkJoin } from 'rxjs';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { UiTable, type UiTableColumn, type UiTableRow } from '@shared/components/ui-table/ui-table';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import { CATALOG_CREATE_HOLD_MS, holdFor } from './catalog-form';

@Component({
  selector: 'app-program-standards-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Button, UiInput, UiLoading, UiTable],
  templateUrl: './program-standards.page.html',
  styleUrl: './program-standards.page.scss',
})
export class ProgramStandardsPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly listPrograms = inject(ListPrograms);
  private readonly listStandards = inject(ListStandards);
  private readonly assignStandards = inject(AssignProgramStandards);
  private readonly toast = inject(ToastService);
  private left = false;

  readonly programId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly listHref = '/catalogo/programas';
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly saving = signal(false);
  readonly creating = signal(false);
  readonly error = signal<string | null>(null);
  readonly program = signal<ProgramEntity | null>(null);
  readonly standards = signal<StandardEntity[]>([]);
  readonly checkedIds = signal<string[]>([]);
  readonly search = new FormControl('', { nonNullable: true });
  readonly query = signal('');

  readonly title = computed(() => {
    const name = this.program()?.name;
    return name ? `Estándares de ${name}` : 'Asignar estándares';
  });

  readonly columns: UiTableColumn[] = [
    { id: 'code', header: 'Código' },
    { id: 'name', header: 'Nombre' },
    { id: 'description', header: 'Descripción' },
    { id: 'use', header: 'Uso' },
  ];

  readonly rows = computed<UiTableRow[]>(() => {
    const assigned = new Set(this.checkedIds());
    return this.standards()
      .filter((item) => matchesAdminSearch([item.code, item.name, item.description], this.query()))
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({
        id: item.id,
        cells: {
          code: item.code,
          name: item.name,
          description: item.description || '—',
          use: assigned.has(item.id) ? 'En el programa' : 'Catálogo',
        },
      }));
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.left = true;
    });
    this.search.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => this.query.set(value));
    forkJoin({
      programs: this.listPrograms.execute(),
      standards: this.listStandards.execute(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ programs, standards }) => {
          const program = programs.find((item) => item.id === this.programId);
          if (!program) {
            this.loadState.set('error');
            return;
          }
          this.program.set(program);
          this.standards.set(standards);
          this.checkedIds.set([...program.standardIds]);
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
  }

  async save(): Promise<void> {
    if (this.saving() || !this.programId) return;
    this.error.set(null);
    this.saving.set(true);
    this.creating.set(true);
    try {
      await Promise.all([
        firstValueFrom(this.assignStandards.execute(this.programId, this.checkedIds())),
        holdFor(CATALOG_CREATE_HOLD_MS),
      ]);
      if (this.left) return;
      this.toast.success('Estándares asignados', 'El programa ya tiene los estándares de evaluación.');
      await this.router.navigateByUrl(this.listHref);
    } catch (err) {
      if (this.left) return;
      this.creating.set(false);
      this.error.set(err instanceof DomainError ? err.message : 'No hemos podido asignar los estándares.');
    } finally {
      if (!this.left) this.saving.set(false);
    }
  }
}
