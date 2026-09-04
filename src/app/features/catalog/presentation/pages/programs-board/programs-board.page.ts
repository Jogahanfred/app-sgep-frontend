import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ListPhases, ListPrograms, ListSubphases } from '@core/application';
import type { ProgramEntity } from '@core/domain/entities';
import { curriculumHours, matchesAdminSearch, programTypeLabel, statusLabel } from '@core/domain/services/admin-catalog';
import { forkJoin } from 'rxjs';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { UiProgramCard } from '@shared/components/ui-program-card/ui-program-card';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

export interface ProgramCard {
  program: ProgramEntity;
  phaseCount: number;
  subphaseCount: number;
  hours: number;
}

@Component({
  selector: 'app-programs-board-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Alert, Button, UiInput, UiLoading, UiProgramCard],
  templateUrl: './programs-board.page.html',
  styleUrl: './programs-board.page.scss',
})
export class ProgramsBoardPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly listPrograms = inject(ListPrograms);
  private readonly listPhases = inject(ListPhases);
  private readonly listSubphases = inject(ListSubphases);

  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly cards = signal<ProgramCard[]>([]);
  readonly search = new FormControl('', { nonNullable: true });
  readonly query = signal('');

  readonly visible = computed(() => {
    const needle = this.query();
    return this.cards().filter((card) =>
      matchesAdminSearch(
        [card.program.code, card.program.name, card.program.description, card.program.programType],
        needle,
      ),
    );
  });

  constructor() {
    this.search.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => this.query.set(value));
    forkJoin({
      programs: this.listPrograms.execute(),
      phases: this.listPhases.execute(),
      subphases: this.listSubphases.execute(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ programs, phases, subphases }) => {
          this.cards.set(
            programs.map((program) => {
              const programPhases = phases.filter((item) => item.programId === program.id);
              const phaseIds = new Set(programPhases.map((item) => item.id));
              const programSubs = subphases.filter((item) => phaseIds.has(item.phaseId));
              return {
                program,
                phaseCount: programPhases.length,
                subphaseCount: programSubs.length,
                hours: curriculumHours(
                  programPhases
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((phase) => ({
                      subphases: programSubs.filter((item) => item.phaseId === phase.id),
                    })),
                ),
              };
            }),
          );
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
  }

  typeLabel = programTypeLabel;
  statusText = statusLabel;

  cardStats(card: ProgramCard): string[] {
    return [
      `${card.phaseCount} ${card.phaseCount === 1 ? 'fase' : 'fases'}`,
      `${card.subphaseCount} ${card.subphaseCount === 1 ? 'subfase' : 'subfases'}`,
      `${card.hours} h`,
    ];
  }
}
