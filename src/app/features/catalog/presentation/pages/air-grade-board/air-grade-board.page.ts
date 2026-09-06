import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { GetAirGradeBoard, type AirGradeBoard, type AirGradeMissionTile, type AirGradeProgramView } from '@core/application';
import type { OperationalContext } from '@core/domain/entities/operational-context';
import { Accordion } from '@shared/components/accordion/accordion';
import { AccordionItem } from '@shared/components/accordion/accordion-item';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { Card } from '@shared/components/card/card';
import { Icon } from '@shared/components/icon/icon';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { ClientSession } from '@layout/client-session.service';
import { AIR_GRADE_COPY, AIR_GRADE_ROUTES } from '../../../constants/air-grades.copy.constants';

@Component({
  selector: 'app-air-grade-board-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Accordion, AccordionItem, Alert, Button, Card, Icon, UiLoading],
  templateUrl: './air-grade-board.page.html',
  styleUrl: './air-grade-board.page.scss',
})
export class AirGradeBoardPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly getBoard = inject(GetAirGradeBoard);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly session = inject(ClientSession);

  readonly copy = AIR_GRADE_COPY;
  readonly listHref = AIR_GRADE_ROUTES.list;
  readonly phasesAccordion = viewChild<Accordion>('phases');
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly board = signal<AirGradeBoard | null>(null);
  readonly selectedProgramId = signal<string | null>(null);
  readonly openSubphases = signal<Record<string, string | null>>({});
  private primedAccordion = false;

  readonly program = computed<AirGradeProgramView | null>(() => {
    const data = this.board();
    if (!data) return null;
    const id = this.selectedProgramId();
    return data.programs.find((item) => item.programId === id) ?? data.programs[0] ?? null;
  });

  constructor() {
    effect(() => {
      const ready = this.loadState() === 'ready';
      const phase = this.program()?.phases[0];
      if (!ready || !phase || this.primedAccordion) return;
      this.primedAccordion = true;
      const subId = phase.subphases[0]?.id ?? null;
      if (subId) this.openSubphases.set({ [phase.id]: subId });
      queueMicrotask(() => {
        const acc = this.phasesAccordion();
        if (acc && !acc.isOpen(phase.id)) acc.toggle(phase.id);
      });
    });

    const userId = this.route.snapshot.paramMap.get('userId') ?? this.session.userId();
    const context = this.operationalContext();
    if (!userId || !context) {
      this.loadState.set('error');
      return;
    }
    this.getBoard
      .execute(context, userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (board) => {
          this.board.set(board);
          const requested =
            this.route.snapshot.paramMap.get('programId') ?? this.route.snapshot.queryParamMap?.get('programa');
          const match = requested ? board.programs.find((item) => item.programId === requested) : null;
          this.selectedProgramId.set(match?.programId ?? board.programs[0]?.programId ?? null);
          this.loadState.set(board.programs.length > 0 ? 'ready' : 'error');
        },
        error: () => this.loadState.set('error'),
      });
  }

  formatScore(value: number | null): string {
    if (value === null) return this.copy.none;
    return value.toLocaleString('es-PE', { minimumFractionDigits: value % 1 === 0 ? 0 : 1, maximumFractionDigits: 2 });
  }

  tileLabel(tile: AirGradeMissionTile): string {
    return `${tile.code} ${this.formatScore(tile.average)}`;
  }

  isSubphaseOpen(phaseId: string, subphaseId: string): boolean {
    return this.openSubphases()[phaseId] === subphaseId;
  }

  toggleSubphase(phaseId: string, subphaseId: string): void {
    this.openSubphases.update((current) => ({
      ...current,
      [phaseId]: current[phaseId] === subphaseId ? null : subphaseId,
    }));
  }

  openTile(tile: AirGradeMissionTile): void {
    const userId = this.board()?.userId;
    if (!userId || !tile.executionId) return;
    void this.router.navigateByUrl(AIR_GRADE_ROUTES.sheet(userId, tile.executionId));
  }

  openSpotlight(): void {
    const tile = this.board()?.spotlight;
    if (tile) this.openTile(tile);
  }

  hoursPercent(flown: number, planned: number): number {
    if (planned <= 0) return 0;
    return Math.min(100, Math.round((flown / planned) * 100));
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
