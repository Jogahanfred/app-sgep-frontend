import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { GetEvaluationCouncil, type EvaluationCouncilResolutionOption, type EvaluationCouncilSession } from '@core/application';
import type { OperationalContext } from '@core/domain/entities/operational-context';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { Card } from '@shared/components/card/card';
import { UiAvatar } from '@shared/components/ui-avatar/ui-avatar';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import { ClientSession } from '../../../../../layout/client-session.service';
import { EVALUATION_COUNCIL_COPY, EVALUATION_COUNCIL_ROUTES } from '../../../constants/evaluation-council.copy.constants';

@Component({
  selector: 'app-evaluation-council-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Button, Card, UiAvatar, UiLoading],
  templateUrl: './evaluation-council-detail.page.html',
  styleUrl: './evaluation-council-detail.page.scss',
})
export class EvaluationCouncilDetailPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly getCouncil = inject(GetEvaluationCouncil);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  readonly session = inject(ClientSession);

  readonly copy = EVALUATION_COUNCIL_COPY;
  readonly listHref = EVALUATION_COUNCIL_ROUTES.list;
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly errorMessage = signal<string>(this.copy.loadError);
  readonly sessionData = signal<EvaluationCouncilSession | null>(null);
  readonly selectedOption = signal<EvaluationCouncilResolutionOption>('reclassify');

  readonly majorityLabel = computed(() => this.optionLabel(this.selectedOption()));

  memberName(userId: string): string {
    const member = this.sessionData()?.members.find((item) => item.userId === userId);
    return member ? `${member.displayName} · ${this.copy.seat[member.seat]}` : userId;
  }

  constructor() {
    const userId = this.route.snapshot.paramMap.get('userId');
    const context = this.operationalContext();
    if (!userId || !context) {
      this.loadState.set('error');
      return;
    }
    this.getCouncil
      .execute(context, userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (session) => {
          this.sessionData.set(session);
          this.selectedOption.set(session.recommended);
          this.loadState.set('ready');
        },
        error: (error: unknown) => {
          this.errorMessage.set(error instanceof Error ? error.message : this.copy.loadError);
          this.loadState.set('error');
        },
      });
  }

  optionLabel(option: EvaluationCouncilResolutionOption): string {
    if (option === 'reinforcement') return this.copy.optionA;
    if (option === 'medical-hold') return this.copy.optionC;
    return this.copy.optionB;
  }

  printSheet(): void {
    this.toast.success(this.copy.printed, this.sessionData()?.displayName ?? '');
  }

  validateQuorum(): void {
    this.toast.success(this.copy.quorumOk, this.copy.quorum);
  }

  elevate(): void {
    const data = this.sessionData();
    if (!data) return;
    this.toast.success(this.copy.elevated, `${data.displayName}. ${this.copy.elevatedLead}`);
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
