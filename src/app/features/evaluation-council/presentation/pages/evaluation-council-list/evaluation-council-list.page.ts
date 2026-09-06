import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ListEvaluationCouncils, type EvaluationCouncilListRow } from '@core/application';
import { matchesAdminSearch } from '@core/domain/services/admin-catalog';
import type { OperationalContext } from '@core/domain/entities/operational-context';
import { Alert } from '@shared/components/alert/alert';
import { Card } from '@shared/components/card/card';
import { UiAvatar } from '@shared/components/ui-avatar/ui-avatar';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { ClientSession } from '../../../../../layout/client-session.service';
import { EVALUATION_COUNCIL_COPY, EVALUATION_COUNCIL_ROUTES } from '../../../constants/evaluation-council.copy.constants';

@Component({
  selector: 'app-evaluation-council-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Card, UiAvatar, UiInput, UiLoading],
  templateUrl: './evaluation-council-list.page.html',
  styleUrl: './evaluation-council-list.page.scss',
})
export class EvaluationCouncilListPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly listCouncils = inject(ListEvaluationCouncils);
  private readonly router = inject(Router);
  private readonly session = inject(ClientSession);

  readonly copy = EVALUATION_COUNCIL_COPY;
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly needsSquadron = signal(false);
  readonly rows = signal<EvaluationCouncilListRow[]>([]);
  readonly search = new FormControl('', { nonNullable: true });
  readonly query = signal('');

  readonly filtered = computed(() => {
    const needle = this.query();
    return this.rows().filter((row) => matchesAdminSearch([row.displayName, row.indicative, row.programName], needle));
  });

  constructor() {
    this.search.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => this.query.set(value));
    const context = this.operationalContext();
    if (!context) {
      this.loadState.set('error');
      return;
    }
    this.listCouncils
      .execute(context)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (board) => {
          this.needsSquadron.set(board.needsSquadron);
          this.rows.set(board.rows);
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
  }

  open(userId: string): void {
    void this.router.navigateByUrl(EVALUATION_COUNCIL_ROUTES.detail(userId));
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
