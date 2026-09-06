import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GetAirGradeBoard, type AirGradeProgramView } from '@core/application';
import type { OperationalContext } from '@core/domain/entities/operational-context';
import { Alert } from '@shared/components/alert/alert';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { UiProgramCard } from '@shared/components/ui-program-card/ui-program-card';
import { ClientSession } from '@layout/client-session.service';
import { AIR_GRADE_COPY, AIR_GRADE_ROUTES } from '../../../constants/air-grades.copy.constants';

@Component({
  selector: 'app-air-grade-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, UiLoading, UiProgramCard],
  templateUrl: './air-grade-list.page.html',
  styleUrl: './air-grade-list.page.scss',
})
export class AirGradeListPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly getBoard = inject(GetAirGradeBoard);
  private readonly session = inject(ClientSession);

  readonly copy = AIR_GRADE_COPY;
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly programs = signal<AirGradeProgramView[]>([]);
  readonly userId = signal<string | null>(null);

  constructor() {
    const context = this.operationalContext();
    if (!context) {
      this.loadState.set('error');
      return;
    }
    this.userId.set(context.userId);
    this.getBoard
      .execute(context, context.userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (board) => {
          this.userId.set(board.userId);
          this.programs.set(board.programs);
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
  }

  href(program: AirGradeProgramView): string {
    const userId = this.userId();
    return userId ? AIR_GRADE_ROUTES.board(userId, program.programId) : AIR_GRADE_ROUTES.list;
  }

  stats(program: AirGradeProgramView): string[] {
    return [
      `${this.copy.cardProgress}: ${program.percentComplete} %`,
      `${this.copy.cardAverage}: ${program.average === null ? this.copy.none : program.average.toFixed(1)}`,
      `${this.copy.cardHours}: ${program.accumulatedHours}`,
    ];
  }

  private operationalContext(): OperationalContext | null {
    const userId = this.session.userId();
    const roleCode = this.session.roleCode();
    if (!userId || !roleCode) return null;
    return {
      userId,
      displayName: this.session.displayName(),
      roleCode,
      assignedUnitId: this.session.assignedUnitId(),
      assignedSquadronId: this.session.assignedSquadronId(),
      unitId: this.session.unitId(),
      squadronId: this.session.squadronId(),
      coversAllSquadrons: this.session.coversAllSquadrons(),
    };
  }
}
