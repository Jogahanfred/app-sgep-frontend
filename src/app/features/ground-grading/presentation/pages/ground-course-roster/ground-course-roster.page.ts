import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  GetGroundCourseRoster,
  SaveGroundCourseGrade,
  type GroundCourseRoster,
  type GroundCourseStudentRow,
} from '@core/application';
import { DomainError } from '@core/domain/errors/domain-error';
import { matchesAdminSearch } from '@core/domain/services/admin-catalog';
import {
  groundRunningAverage,
  groundSheetCode,
  sanitizeGroundGradeInput,
} from '@core/domain/services/ground-instruction-grade';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { ClientSession } from '@layout/client-session.service';
import { GROUND_GRADING_COPY, GROUND_GRADING_ROUTES } from '../../../constants/ground-grading.copy.constants';

@Component({
  selector: 'app-ground-course-roster',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Button, UiInput],
  templateUrl: './ground-course-roster.page.html',
  styleUrl: './ground-course-roster.page.scss',
})
export class GroundCourseRosterPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly rosterQuery = inject(GetGroundCourseRoster);
  private readonly saveGrade = inject(SaveGroundCourseGrade);
  private readonly session = inject(ClientSession);

  readonly copy = GROUND_GRADING_COPY;
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly error = signal<string | null>(null);
  readonly roster = signal<GroundCourseRoster | null>(null);
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
    const syllabus = this.roster()?.assessments ?? [];
    return syllabus.map((item, index) => ({
      code: item.code,
      sheetCode: groundSheetCode(syllabus, index),
      name: item.name,
    }));
  });

  constructor() {
    this.search.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => this.query.set(value));
    this.reload();
  }

  back(): void {
    void this.router.navigateByUrl(GROUND_GRADING_ROUTES.inbox);
  }

  rowIndex(index: number): string {
    return String(index + 1).padStart(2, '0');
  }

  cellValue(student: GroundCourseStudentRow, code: string): string {
    const draft = this.drafts()[student.enrollmentId]?.[code];
    if (draft !== undefined) return draft;
    const grade = student.assessments.find((item) => item.code === code)?.grade;
    return grade === null || grade === undefined ? '' : String(grade);
  }

  average(student: GroundCourseStudentRow): string {
    const grades = student.assessments.map((item) => {
      const raw = this.cellValue(student, item.code).trim().replace(',', '.');
      if (!raw) return null;
      const value = Number(raw);
      return Number.isFinite(value) ? value : null;
    });
    const average = groundRunningAverage(grades);
    return average === null ? this.copy.none : String(average).replace('.', ',');
  }

  isDirty(student: GroundCourseStudentRow): boolean {
    return this.dirtyCodes(student).length > 0;
  }

  onGradeKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key.length !== 1) return;
    if (/[\d.,]/.test(event.key)) return;
    event.preventDefault();
  }

  onGradeInput(student: GroundCourseStudentRow, code: string, event: Event): void {
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

  async saveRow(student: GroundCourseStudentRow): Promise<void> {
    if (!student.canGrade || !this.isDirty(student)) return;
    const context = this.session.operationalContext();
    const courseId = this.roster()?.courseId;
    if (!context || !courseId) return;
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
        await firstValueFrom(this.saveGrade.execute(context, { enrollmentId: student.enrollmentId, courseId, code, grade }));
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

  private dirtyCodes(student: GroundCourseStudentRow): string[] {
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
    const courseId = this.route.snapshot.paramMap.get('courseId');
    if (!context || !programId || !promotionId || !courseId) {
      this.loadState.set('error');
      return;
    }
    this.loadState.set('loading');
    this.rosterQuery
      .execute(context, { programId, promotionId, courseId })
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
