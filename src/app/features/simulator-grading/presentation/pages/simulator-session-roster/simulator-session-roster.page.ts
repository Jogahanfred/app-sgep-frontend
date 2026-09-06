import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  GetSimulatorSessionRoster,
  SaveSimulatorSessionGrade,
  type SimulatorSessionRoster,
  type SimulatorSessionStudentRow,
} from '@core/application';
import { DomainError } from '@core/domain/errors/domain-error';
import { matchesAdminSearch } from '@core/domain/services/admin-catalog';
import { groundRunningAverage, sanitizeGroundGradeInput } from '@core/domain/services/ground-instruction-grade';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { ClientSession } from '@layout/client-session.service';
import { SIMULATOR_GRADING_COPY, SIMULATOR_GRADING_ROUTES } from '../../../constants/simulator-grading.copy.constants';

@Component({
  selector: 'app-simulator-session-roster',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Button, UiInput],
  templateUrl: './simulator-session-roster.page.html',
  styleUrl: './simulator-session-roster.page.scss',
})
export class SimulatorSessionRosterPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly rosterQuery = inject(GetSimulatorSessionRoster);
  private readonly saveGrade = inject(SaveSimulatorSessionGrade);
  private readonly session = inject(ClientSession);

  readonly copy = SIMULATOR_GRADING_COPY;
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly error = signal<string | null>(null);
  readonly roster = signal<SimulatorSessionRoster | null>(null);
  readonly search = new FormControl('', { nonNullable: true });
  readonly query = signal('');
  readonly drafts = signal<Record<string, Record<string, string>>>({});
  readonly savingId = signal<string | null>(null);

  readonly students = computed(() => {
    const needle = this.query();
    return (this.roster()?.students ?? []).filter((item) =>
      matchesAdminSearch([item.displayName, item.indicative], needle),
    );
  });

  readonly columns = computed(() => {
    const first = this.roster()?.students[0]?.assessments;
    if (first?.length) return first;
    return this.roster()?.assessments ?? [];
  });

  constructor() {
    this.search.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => this.query.set(value));
    this.reload();
  }

  back(): void {
    void this.router.navigateByUrl(SIMULATOR_GRADING_ROUTES.inbox);
  }

  rowIndex(index: number): string {
    return String(index + 1).padStart(2, '0');
  }

  cellValue(student: SimulatorSessionStudentRow, code: string): string {
    const draft = this.drafts()[student.enrollmentId]?.[code];
    if (draft !== undefined) return draft;
    const grade = student.assessments.find((item) => item.code === code)?.grade;
    return grade === null || grade === undefined ? '' : String(grade);
  }

  average(student: SimulatorSessionStudentRow): string {
    const grades = student.assessments.map((item) => {
      const raw = this.cellValue(student, item.code).trim().replace(',', '.');
      if (!raw) return null;
      const value = Number(raw);
      return Number.isFinite(value) ? value : null;
    });
    const average = groundRunningAverage(grades);
    return average === null ? this.copy.none : String(average).replace('.', ',');
  }

  isDirty(student: SimulatorSessionStudentRow): boolean {
    return this.dirtyCodes(student).length > 0;
  }

  onGradeKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key.length !== 1) return;
    if (/[\d.,]/.test(event.key)) return;
    event.preventDefault();
  }

  onGradeInput(student: SimulatorSessionStudentRow, code: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = sanitizeGroundGradeInput(input.value);
    if (input.value !== value) input.value = value;
    this.drafts.update((current) => ({
      ...current,
      [student.enrollmentId]: {
        ...(current[student.enrollmentId] ?? {}),
        [code]: value,
      },
    }));
  }

  async saveRow(student: SimulatorSessionStudentRow): Promise<void> {
    if (!student.canGrade || !this.isDirty(student)) return;
    const context = this.session.operationalContext();
    const sessionId = this.roster()?.sessionId;
    if (!context || !sessionId) return;
    const codes = this.dirtyCodes(student);
    this.savingId.set(student.enrollmentId);
    this.error.set(null);
    try {
      for (const code of codes) {
        const grade = this.parsedGrade(this.cellValue(student, code));
        if (grade === null) {
          this.error.set(this.copy.saveError);
          return;
        }
        await firstValueFrom(
          this.saveGrade.execute(context, { enrollmentId: student.enrollmentId, sessionId, code, grade }),
        );
        this.roster.update((board) => {
          if (!board) return board;
          return {
            ...board,
            students: board.students.map((row) => {
              if (row.enrollmentId !== student.enrollmentId) return row;
              return {
                ...row,
                assessments: row.assessments.map((item) =>
                  item.code === code ? { ...item, status: 'completed' as const, grade } : item,
                ),
              };
            }),
          };
        });
      }
      this.drafts.update((current) => {
        const next = { ...current };
        delete next[student.enrollmentId];
        return next;
      });
    } catch (err: unknown) {
      this.error.set(err instanceof DomainError ? err.message : this.copy.saveError);
    } finally {
      this.savingId.set(null);
    }
  }

  private parsedGrade(raw: string): number | null {
    const value = Number(raw.trim().replace(',', '.'));
    if (!Number.isFinite(value) || value < 0 || value > 20) return null;
    return Math.round(value * 10) / 10;
  }

  private dirtyCodes(student: SimulatorSessionStudentRow): string[] {
    const draft = this.drafts()[student.enrollmentId];
    if (!draft) return [];
    return student.assessments
      .filter((item) => {
        if (!(item.code in draft)) return false;
        const next = this.parsedGrade(draft[item.code] ?? '');
        return next !== null && next !== item.grade;
      })
      .map((item) => item.code);
  }

  private reload(): void {
    const context = this.session.operationalContext();
    const programId = this.route.snapshot.paramMap.get('programId');
    const promotionId = this.route.snapshot.paramMap.get('promotionId');
    const sessionId = this.route.snapshot.paramMap.get('sessionId');
    if (!context || !programId || !promotionId || !sessionId) {
      this.loadState.set('error');
      return;
    }
    this.loadState.set('loading');
    this.rosterQuery
      .execute(context, { programId, promotionId, sessionId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (roster) => {
          this.roster.set(roster);
          this.drafts.set({});
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
  }
}
