import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ListPersonnelDossiers, type PersonnelDossierListRow } from '@core/application';
import { matchesAdminSearch } from '@core/domain/services/admin-catalog';
import type { OperationalContext } from '@core/domain/entities/operational-context';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { Icon } from '@shared/components/icon/icon';
import { UiAvatar } from '@shared/components/ui-avatar/ui-avatar';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import { ClientSession } from '../../../../../layout/client-session.service';
import { PERSONNEL_DOSSIER_COPY, PERSONNEL_DOSSIER_ROUTES } from '../../../constants/personnel-dossier.copy.constants';

@Component({
  selector: 'app-personnel-dossier-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Button, Icon, UiAvatar, UiInput, UiLoading, UiSelect],
  templateUrl: './personnel-dossier-list.page.html',
  styleUrl: './personnel-dossier-list.page.scss',
})
export class PersonnelDossierListPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly listDossiers = inject(ListPersonnelDossiers);
  private readonly router = inject(Router);
  private readonly session = inject(ClientSession);

  readonly copy = PERSONNEL_DOSSIER_COPY;
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly needsSquadron = signal(false);
  readonly rows = signal<PersonnelDossierListRow[]>([]);
  readonly search = new FormControl('', { nonNullable: true });
  readonly query = signal('');
  readonly page = signal(1);
  readonly pageSize = signal(9);
  readonly pageSizeOptions: readonly number[] = [6, 9, 12];

  readonly filtered = computed(() => {
    const needle = this.query();
    return this.rows().filter((row) =>
      matchesAdminSearch(
        [row.displayName, row.firstName, row.lastName, row.indicative, row.documentNumber, row.programName, row.gradeLabel, row.specialtyLabel],
        needle,
      ),
    );
  });

  readonly totalHours = computed(() => this.filtered().reduce((sum, row) => sum + row.hours, 0));
  readonly atRiskCount = computed(() => this.filtered().filter((row) => row.councilEligible).length);
  readonly total = computed(() => this.filtered().length);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize()) || 1));
  readonly paged = computed(() => {
    const size = this.pageSize();
    const start = (this.page() - 1) * size;
    return this.filtered().slice(start, start + size);
  });
  readonly rangeStart = computed(() => (this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1));
  readonly rangeEnd = computed(() => Math.min(this.page() * this.pageSize(), this.total()));
  readonly rangeLabel = computed(() => {
    if (this.total() === 0) return '0 resultados';
    return `Mostrando ${this.rangeStart()} - ${this.rangeEnd()} de ${this.total()}`;
  });
  readonly pageItems = computed(() => this.buildPageItems(this.page(), this.totalPages()));
  readonly canPrev = computed(() => this.page() > 1);
  readonly canNext = computed(() => this.page() < this.totalPages());
  readonly showPager = computed(() => this.loadState() === 'ready' && this.total() > 0);
  readonly pageSizeChoices = computed(() =>
    this.pageSizeOptions.map((size) => ({ value: String(size), label: String(size) })),
  );

  constructor() {
    this.search.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.query.set(value);
      this.page.set(1);
    });
    effect(() => {
      const pages = this.totalPages();
      untracked(() => {
        if (this.page() > pages) this.page.set(pages);
      });
    });
    const context = this.operationalContext();
    if (!context) {
      this.loadState.set('error');
      return;
    }
    if (context.roleCode === 'PILOT') {
      void this.router.navigateByUrl(PERSONNEL_DOSSIER_ROUTES.detail(context.userId), { replaceUrl: true });
      return;
    }
    this.listDossiers
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

  detailHref(userId: string): string {
    return PERSONNEL_DOSSIER_ROUTES.detail(userId);
  }

  onPageSize(value: string): void {
    const size = Number(value);
    if (!this.pageSizeOptions.includes(size)) return;
    this.pageSize.set(size);
    this.page.set(1);
  }

  goToPage(page: number): void {
    this.page.set(Math.min(this.totalPages(), Math.max(1, page)));
  }

  first(): void {
    this.goToPage(1);
  }

  prev(): void {
    this.goToPage(this.page() - 1);
  }

  next(): void {
    this.goToPage(this.page() + 1);
  }

  last(): void {
    this.goToPage(this.totalPages());
  }

  private buildPageItems(current: number, total: number): (number | 'ellipsis')[] {
    if (total <= 7) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }
    const items: (number | 'ellipsis')[] = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    if (start > 2) items.push('ellipsis');
    for (let page = start; page <= end; page += 1) items.push(page);
    if (end < total - 1) items.push('ellipsis');
    items.push(total);
    return items;
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
