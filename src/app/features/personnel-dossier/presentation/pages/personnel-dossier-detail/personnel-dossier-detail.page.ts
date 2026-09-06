import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { GetPersonnelDossier, type PersonnelDossierDetail } from '@core/application';
import type { OperationalContext } from '@core/domain/entities/operational-context';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { Card } from '@shared/components/card/card';
import { UiAvatar } from '@shared/components/ui-avatar/ui-avatar';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { UiProgramCard } from '@shared/components/ui-program-card/ui-program-card';
import { ClientSession } from '../../../../../layout/client-session.service';
import { EVALUATION_COUNCIL_ROUTES } from '../../../../evaluation-council/constants/evaluation-council.copy.constants';
import { PERSONNEL_DOSSIER_COPY, PERSONNEL_DOSSIER_ROUTES } from '../../../constants/personnel-dossier.copy.constants';

@Component({
  selector: 'app-personnel-dossier-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Button, Card, UiAvatar, UiInput, UiLoading, UiProgramCard],
  templateUrl: './personnel-dossier-detail.page.html',
  styleUrl: './personnel-dossier-detail.page.scss',
})
export class PersonnelDossierDetailPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly getDossier = inject(GetPersonnelDossier);
  private readonly route = inject(ActivatedRoute);
  readonly session = inject(ClientSession);

  readonly copy = PERSONNEL_DOSSIER_COPY;
  readonly listHref = PERSONNEL_DOSSIER_ROUTES.list;
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly detail = signal<PersonnelDossierDetail | null>(null);
  readonly filter = new FormControl('', { nonNullable: true });
  readonly query = signal('');

  readonly filteredLog = computed(() => {
    const needle = this.query().trim().toLowerCase();
    const rows = this.detail()?.log ?? [];
    if (!needle) return rows;
    return rows.filter((row) =>
      `${row.missionCode} ${row.missionName} ${row.aircraft} ${row.instructorName}`.toLowerCase().includes(needle),
    );
  });

  readonly councilHref = computed(() => {
    const id = this.detail()?.userId;
    return id ? EVALUATION_COUNCIL_ROUTES.detail(id) : EVALUATION_COUNCIL_ROUTES.list;
  });

  readonly chartPath = computed(() => {
    const points = this.detail()?.trajectory ?? [];
    if (points.length < 2) return '';
    const width = 700;
    const height = 160;
    const left = 40;
    const top = 16;
    const innerW = width - left - 16;
    const innerH = height - top - 28;
    return points
      .map((point, index) => {
        const x = left + (index / (points.length - 1)) * innerW;
        const y = top + innerH - (Math.min(20, Math.max(0, point.score)) / 20) * innerH;
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  });

  constructor() {
    this.filter.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => this.query.set(value));
    const userId = this.route.snapshot.paramMap.get('userId');
    const context = this.operationalContext();
    if (!userId || !context) {
      this.loadState.set('error');
      return;
    }
    this.getDossier
      .execute(context, userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detail) => {
          this.detail.set(detail);
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
  }

  percent(part: number, total: number): string {
    if (!total) return '0%';
    return `${Math.round((part / total) * 100)}%`;
  }

  resultLabel(result: string | null): string {
    if (!result) return this.copy.none;
    return this.copy.result[result as keyof typeof this.copy.result] ?? result;
  }

  programHref(programId: string): string {
    const userId = this.detail()?.userId;
    return userId ? PERSONNEL_DOSSIER_ROUTES.program(userId, programId) : this.listHref;
  }

  programStats(program: PersonnelDossierDetail['programs'][number]): string[] {
    const stats = [`${program.percentComplete}%`, `${program.hours} ${this.copy.hoursUnit}`];
    if (program.average !== null) stats.push(`${this.copy.colAverage} ${program.average.toFixed(1)}`);
    return stats;
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
