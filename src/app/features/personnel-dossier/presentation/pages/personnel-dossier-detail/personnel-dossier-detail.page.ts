import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { GetPersonnelDossier, type PersonnelDossierDetail } from '@core/application';
import { AIR_GRADE_PASS_THRESHOLD } from '@core/domain/services/air-grade-tiles';
import type { OperationalContext } from '@core/domain/entities/operational-context';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { Card } from '@shared/components/card/card';
import { Icon } from '@shared/components/icon/icon';
import { UiAvatar } from '@shared/components/ui-avatar/ui-avatar';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { UiProgramCard } from '@shared/components/ui-program-card/ui-program-card';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import { ClientSession } from '../../../../../layout/client-session.service';
import { EVALUATION_COUNCIL_ROUTES } from '../../../../evaluation-council/constants/evaluation-council.copy.constants';
import { PERSONNEL_DOSSIER_COPY, PERSONNEL_DOSSIER_ROUTES } from '../../../constants/personnel-dossier.copy.constants';

@Component({
  selector: 'app-personnel-dossier-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Button, Card, Icon, UiAvatar, UiInput, UiLoading, UiProgramCard],
  templateUrl: './personnel-dossier-detail.page.html',
  styleUrl: './personnel-dossier-detail.page.scss',
})
export class PersonnelDossierDetailPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly getDossier = inject(GetPersonnelDossier);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  readonly session = inject(ClientSession);

  readonly copy = PERSONNEL_DOSSIER_COPY;
  readonly listHref = PERSONNEL_DOSSIER_ROUTES.list;
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly detail = signal<PersonnelDossierDetail | null>(null);
  readonly filter = new FormControl('', { nonNullable: true });
  readonly query = signal('');
  readonly folderView = signal<'grid' | 'list'>('grid');

  readonly filteredLog = computed(() => {
    const needle = this.query().trim().toLowerCase();
    const rows = this.detail()?.log ?? [];
    if (!needle) return rows;
    return rows.filter((row) =>
      `${row.missionCode} ${row.missionName} ${row.aircraft} ${row.instructorName}`.toLowerCase().includes(needle),
    );
  });

  readonly filteredFolios = computed(() => {
    const needle = this.query().trim().toLowerCase();
    const rows = this.detail()?.folios ?? [];
    if (!needle) return rows;
    return rows.filter((row) => `${row.code} ${row.title} ${row.source}`.toLowerCase().includes(needle));
  });

  readonly unsignedLog = computed(() => (this.detail()?.log ?? []).filter((row) => !row.signed).slice(0, 5));

  readonly folders = computed(() => {
    const data = this.detail();
    if (!data) return [];
    return [
      {
        id: 'data' as const,
        title: this.copy.folderData,
        count: 2 + data.specialtyNames.length + (data.promotionName ? 1 : 0),
        href: '#pd-hero',
        hint: data.squadronName,
      },
      { id: 'flight' as const, title: this.copy.folderFlight, count: data.log.length, href: '#pd-log', hint: `${data.hours.total} ${this.copy.hoursUnit}` },
      { id: 'grades' as const, title: this.copy.folderGrades, count: data.evaluatedCount, href: '#pd-chart', hint: data.average === null ? this.copy.none : data.average.toFixed(2) },
      { id: 'licenses' as const, title: this.copy.folderLicenses, count: data.licenses.length, href: '#pd-licenses', hint: this.copy.licensesTitle },
      { id: 'programs' as const, title: this.copy.folderPrograms, count: data.programs.length, href: '#pd-programs', hint: data.programName ?? this.copy.none },
      { id: 'rulings' as const, title: this.copy.folderRulings, count: data.resolutions.length, href: '#pd-folios', hint: this.copy.rulingsTitle },
    ];
  });

  readonly councilHref = computed(() => {
    const id = this.detail()?.userId;
    return id ? EVALUATION_COUNCIL_ROUTES.detail(id) : EVALUATION_COUNCIL_ROUTES.list;
  });

  readonly statusLabel = computed(() => {
    const status = this.detail()?.academicStatus;
    return status ? this.copy.status[status] : this.copy.opsActive;
  });

  readonly licenseChip = computed(() => this.detail()?.licenses[0] ?? null);

  readonly signedPercent = computed(() => {
    const data = this.detail();
    if (!data?.log.length) return 0;
    return Math.round((data.signedCount / data.log.length) * 100);
  });

  readonly hoursTarget = computed(() => {
    const data = this.detail();
    if (!data || data.percentComplete === null || data.percentComplete <= 0) return null;
    return Math.round((data.hours.total / (data.percentComplete / 100)) * 10) / 10;
  });

  readonly hoursRemaining = computed(() => {
    const target = this.hoursTarget();
    const total = this.detail()?.hours.total;
    if (target === null || total === undefined) return null;
    return Math.max(0, Math.round((target - total) * 10) / 10);
  });

  readonly ring = computed(() => {
    const progress = Math.min(100, Math.max(0, this.detail()?.percentComplete ?? 0));
    const signed = Math.min(100, Math.max(0, this.signedPercent()));
    const outer = 2 * Math.PI * 48;
    const inner = 2 * Math.PI * 36;
    return {
      outer,
      inner,
      outerOffset: outer * (1 - progress / 100),
      innerOffset: inner * (1 - signed / 100),
    };
  });

  readonly chart = computed(() => {
    const points = this.detail()?.trajectory ?? [];
    const average = this.detail()?.average;
    if (points.length < 2) return null;
    const width = 760;
    const height = 180;
    const left = 44;
    const right = 16;
    const top = 20;
    const bottom = 28;
    const innerW = width - left - right;
    const innerH = height - top - bottom;
    const y = (score: number) => top + innerH - (Math.min(20, Math.max(0, score)) / 20) * innerH;
    const coords = points.map((point, index) => {
      const x = left + (index / (points.length - 1)) * innerW;
      return { x, y: y(point.score), label: point.label };
    });
    const line = coords.map((item) => `${item.x.toFixed(1)},${item.y.toFixed(1)}`).join(' ');
    const area = `${line} ${coords[coords.length - 1]!.x.toFixed(1)},${(top + innerH).toFixed(1)} ${coords[0]!.x.toFixed(1)},${(top + innerH).toFixed(1)}`;
    const ticks = [0, Math.floor((points.length - 1) / 3), Math.floor(((points.length - 1) * 2) / 3), points.length - 1];
    return {
      line,
      area,
      coords,
      averageY: average === null || average === undefined ? null : y(average),
      passY: y(AIR_GRADE_PASS_THRESHOLD),
      topY: y(20),
      labels: [...new Set(ticks)].map((index) => ({
        x: coords[index]!.x,
        text: points[index]!.label,
      })),
    };
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

  initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  notifySign(): void {
    this.toast.info(this.copy.signAction, this.copy.signToast);
  }

  notifyDownload(): void {
    this.toast.info(this.copy.downloadAction, this.copy.downloadToast);
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
