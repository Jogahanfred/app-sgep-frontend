import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { GetPersonnelDossierCurriculum, type DossierCurriculum } from '@core/application';
import type { OperationalContext } from '@core/domain/entities/operational-context';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { Card } from '@shared/components/card/card';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { ClientSession } from '../../../../../layout/client-session.service';
import { PERSONNEL_DOSSIER_COPY, PERSONNEL_DOSSIER_ROUTES } from '../../../constants/personnel-dossier.copy.constants';

@Component({
  selector: 'app-personnel-dossier-curriculum-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Button, Card, UiLoading],
  templateUrl: './personnel-dossier-curriculum.page.html',
  styleUrl: './personnel-dossier-curriculum.page.scss',
})
export class PersonnelDossierCurriculumPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly getCurriculum = inject(GetPersonnelDossierCurriculum);
  private readonly route = inject(ActivatedRoute);
  private readonly session = inject(ClientSession);

  readonly copy = PERSONNEL_DOSSIER_COPY;
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly curriculum = signal<DossierCurriculum | null>(null);
  readonly backHref = PERSONNEL_DOSSIER_ROUTES.detail(this.route.snapshot.paramMap.get('userId') ?? '');

  constructor() {
    const userId = this.route.snapshot.paramMap.get('userId');
    const programId = this.route.snapshot.paramMap.get('programId');
    const context = this.operationalContext();
    if (!userId || !programId || !context) {
      this.loadState.set('error');
      return;
    }
    this.getCurriculum
      .execute(context, userId, programId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (curriculum) => {
          this.curriculum.set(curriculum);
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
  }

  tileTone(score: number | null, evaluated: boolean): string {
    if (!evaluated || score === null) return 'pending';
    if (score < 12) return 'low';
    if (score < 16) return 'mid';
    return 'high';
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
