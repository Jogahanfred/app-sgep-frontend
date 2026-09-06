import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import {
  GetSimulatorInstructionBoard,
  type SimulatorInstructionBoard,
  type SimulatorInstructionSessionCard,
} from '@core/application';
import { matchesAdminSearch } from '@core/domain/services/admin-catalog';
import { Alert } from '@shared/components/alert/alert';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import type { ChoiceOption } from '@shared/models/choice.model';
import { ClientSession } from '@layout/client-session.service';
import { SIMULATOR_GRADING_COPY, SIMULATOR_GRADING_ROUTES } from '../../../constants/simulator-grading.copy.constants';

@Component({
  selector: 'app-simulator-grading-inbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, UiInput, UiSelect],
  templateUrl: './simulator-grading-inbox.page.html',
  styleUrl: './simulator-grading-inbox.page.scss',
})
export class SimulatorGradingInboxPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly boardQuery = inject(GetSimulatorInstructionBoard);
  private readonly router = inject(Router);
  private readonly session = inject(ClientSession);

  readonly copy = SIMULATOR_GRADING_COPY;
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly board = signal<SimulatorInstructionBoard | null>(null);
  readonly programId = signal('');
  readonly promotionId = signal('');
  readonly search = new FormControl('', { nonNullable: true });
  readonly query = signal('');

  readonly programOptions = computed<ChoiceOption[]>(() =>
    (this.board()?.programs ?? []).map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` })),
  );

  readonly promotionOptions = computed<ChoiceOption[]>(() => {
    const programId = this.programId();
    return (this.board()?.promotions ?? [])
      .filter((item) => !programId || item.programIds.includes(programId))
      .map((item) => ({ value: item.id, label: `${item.name} · ${item.year}` }));
  });

  readonly offering = computed(() => {
    const programId = this.programId();
    const promotionId = this.promotionId();
    if (!programId || !promotionId) return null;
    return this.board()?.offerings.find((item) => item.programId === programId && item.promotionId === promotionId) ?? null;
  });

  readonly sessions = computed(() => {
    const needle = this.query();
    return (this.offering()?.sessions ?? []).filter((item) => matchesAdminSearch([item.name, item.code], needle));
  });

  constructor() {
    this.search.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => this.query.set(value));
    const context = this.session.operationalContext();
    if (!context) {
      this.loadState.set('error');
      return;
    }
    this.boardQuery
      .execute(context)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (board) => {
          this.board.set(board);
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
  }

  onProgram(value: string): void {
    this.programId.set(value);
    if (value && !this.promotionOptions().some((item) => item.value === this.promotionId())) {
      this.promotionId.set('');
    }
  }

  onPromotion(value: string): void {
    this.promotionId.set(value);
  }

  hoursLabel(value: number): string {
    return `${value}h`;
  }

  openSession(session: SimulatorInstructionSessionCard): void {
    const programId = this.programId();
    const promotionId = this.promotionId();
    if (!programId || !promotionId) return;
    void this.router.navigateByUrl(SIMULATOR_GRADING_ROUTES.session(programId, promotionId, session.id));
  }
}
