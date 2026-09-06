import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  GetAirGradeSheet,
  RequestAirGradeObjection,
  SignAirGradeMission,
  type AirGradeManeuverView,
  type AirGradeMissionTile,
  type AirGradeSheet,
} from '@core/application';
import { dirbeLevelDelta, dirbepGradeChipClass, formatDirbeLevelDelta } from '@core/domain/entities';
import type { OperationalContext } from '@core/domain/entities/operational-context';
import { DomainError } from '@core/domain/errors/domain-error';
import { AIR_GRADE_PASS_THRESHOLD } from '@core/domain/services/air-grade-tiles';
import { MISSION_GRADE_SCALE } from '@core/domain/services/mission-execution-grade';
import type { DirbepGradeCode } from '@core/domain/constants/dirbep-grade.constants';
import { Accordion } from '@shared/components/accordion/accordion';
import { AccordionItem } from '@shared/components/accordion/accordion-item';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { Card } from '@shared/components/card/card';
import { Icon } from '@shared/components/icon/icon';
import { UiAvatar } from '@shared/components/ui-avatar/ui-avatar';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import { ClientSession } from '@layout/client-session.service';
import { MissionSignatureDialog, type MissionSignatureDraft } from '../mission-workspace/mission-signature-dialog';
import { AIR_GRADE_COPY, AIR_GRADE_ROUTES } from '../../../constants/air-grades.copy.constants';

@Component({
  selector: 'app-air-grade-sheet-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, Accordion, AccordionItem, Alert, Button, Card, Icon, UiAvatar, UiLoading, MissionSignatureDialog],
  templateUrl: './air-grade-sheet.page.html',
  styleUrl: './air-grade-sheet.page.scss',
})
export class AirGradeSheetPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly getSheet = inject(GetAirGradeSheet);
  private readonly signMission = inject(SignAirGradeMission);
  private readonly requestObjection = inject(RequestAirGradeObjection);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly session = inject(ClientSession);

  readonly copy = AIR_GRADE_COPY;
  readonly gradeClass = dirbepGradeChipClass;
  readonly gradeScale = MISSION_GRADE_SCALE as readonly DirbepGradeCode[];
  readonly passThreshold = AIR_GRADE_PASS_THRESHOLD;
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly saving = signal(false);
  readonly sheet = signal<AirGradeSheet | null>(null);
  readonly signing = signal(false);
  readonly maneuversAccordion = viewChild<Accordion>('maneuvers');
  private corOpened = false;

  readonly headingLead = computed(() => {
    const sheet = this.sheet();
    if (!sheet) return this.copy.sheetLead;
    return `${sheet.missionCode} · ${sheet.missionName}`;
  });

  readonly boardHref = computed(() => {
    const sheet = this.sheet();
    if (sheet?.studentUserId) return AIR_GRADE_ROUTES.board(sheet.studentUserId, sheet.programId);
    return AIR_GRADE_ROUTES.list;
  });

  readonly resultLabel = computed(() => {
    const result = this.sheet()?.result;
    return result ? this.copy.results[result] : this.copy.results.pending;
  });

  readonly delta = computed(() => {
    const average = this.sheet()?.average;
    if (average === null || average === undefined) return null;
    return Math.round((average - AIR_GRADE_PASS_THRESHOLD) * 10) / 10;
  });

  readonly canSubmit = computed(
    () => !!this.sheet()?.canSignStudent && this.sheet()?.pendingStudentSignature && !this.saving(),
  );

  constructor() {
    effect(() => {
      const accordion = this.maneuversAccordion();
      const sheet = this.sheet();
      if (this.corOpened || !accordion || !sheet) return;
      const corId = sheet.maneuvers.find((row) => this.hasCor(row))?.id;
      if (!corId) return;
      this.corOpened = true;
      queueMicrotask(() => accordion.toggle(corId));
    });
    const userId = this.route.snapshot.paramMap.get('userId');
    const executionId = this.route.snapshot.paramMap.get('executionId');
    const context = this.operationalContext();
    if (!userId || !executionId || !context) {
      this.loadState.set('error');
      return;
    }
    this.getSheet
      .execute(context, userId, executionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (sheet) => {
          this.sheet.set(sheet);
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
  }

  formatScore(value: number | null | undefined): string {
    if (value === null || value === undefined) return this.copy.none;
    return value.toLocaleString('es-PE', { minimumFractionDigits: value % 1 === 0 ? 0 : 1, maximumFractionDigits: 2 });
  }

  formatDate(value: string | null): string {
    if (!value) return this.copy.none;
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  pad(value: number): string {
    return String(value).padStart(2, '0');
  }

  gradeTitle(grade: DirbepGradeCode): string {
    return `${grade}: ${this.copy.grades[grade]}`;
  }

  hasCor(row: AirGradeManeuverView): boolean {
    return row.corrected || !!row.cause || !!row.recommendation || !!row.observation;
  }

  hasAnyCor(rows: readonly AirGradeManeuverView[]): boolean {
    return rows.some((row) => this.hasCor(row));
  }

  isSignatureAnchor(row: AirGradeManeuverView, rows: readonly AirGradeManeuverView[]): boolean {
    return rows.find((item) => this.hasCor(item))?.id === row.id;
  }

  gradeDelta(row: AirGradeManeuverView): number {
    return dirbeLevelDelta(row.expectedStandard, row.grade);
  }

  gradeDeltaLabel(row: AirGradeManeuverView): string {
    return formatDirbeLevelDelta(this.gradeDelta(row));
  }

  toggleManeuver(accordion: Accordion, row: AirGradeManeuverView, itemId: string): void {
    if (!this.hasCor(row)) return;
    accordion.toggle(itemId);
  }

  openHistory(tile: AirGradeMissionTile): void {
    const userId = this.sheet()?.studentUserId;
    if (!userId || !tile.executionId) return;
    void this.router.navigateByUrl(AIR_GRADE_ROUTES.sheet(userId, tile.executionId));
  }

  openSign(): void {
    if (!this.canSubmit()) return;
    this.signing.set(true);
  }

  closeSign(): void {
    this.signing.set(false);
  }

  applySign(draft: MissionSignatureDraft): void {
    const context = this.operationalContext();
    const executionId = this.sheet()?.executionId;
    if (!context || !executionId) return;
    this.saving.set(true);
    this.signMission.execute(context, executionId, draft).subscribe({
      next: (execution) => {
        const current = this.sheet();
        if (current) {
          this.sheet.set({
            ...current,
            studentSignature: execution.studentSignature ?? current.studentSignature,
            pendingStudentSignature: false,
          });
        }
        this.signing.set(false);
        this.saving.set(false);
        this.toast.success(this.copy.signedSuccess, this.copy.signedSuccessLead);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.signing.set(false);
        const message = error instanceof DomainError ? error.message : this.copy.signError;
        this.toast.error(this.copy.signError, message);
      },
    });
  }

  sendObjection(): void {
    const context = this.operationalContext();
    const executionId = this.sheet()?.executionId;
    if (!context || !executionId || !this.sheet()?.canSignStudent || !this.sheet()?.pendingStudentSignature) return;
    this.saving.set(true);
    this.requestObjection.execute(context, executionId).subscribe({
      next: (execution) => {
        const current = this.sheet();
        if (current) {
          this.sheet.set({
            ...current,
            counselRequested: execution.counselRequested ?? true,
            pendingStudentSignature: false,
          });
        }
        this.saving.set(false);
        this.toast.info(this.copy.objectionRecorded, this.copy.objectionSent);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        const message = error instanceof DomainError ? error.message : this.copy.objectionError;
        this.toast.error(this.copy.objectionError, message);
      },
    });
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
