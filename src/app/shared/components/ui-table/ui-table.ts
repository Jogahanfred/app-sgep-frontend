import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  linkedSignal,
  output,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { Icon } from '../icon/icon';
import { UiLoading } from '../ui-loading/ui-loading';

export type UiTableBadgeTone = 'active' | 'inactive';
export type UiTableAlign = 'left' | 'center' | 'right';

export interface UiTableColumn {
  id: string;
  header: string;
  align?: UiTableAlign;
}

export interface UiTableCell {
  text: string;
  badge?: UiTableBadgeTone;
  href?: string;
}

export interface UiTableRow {
  id: string;
  cells: Record<string, UiTableCell | string>;
}

@Component({
  selector: 'ui-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ClickOutsideDirective, Icon, UiLoading],
  templateUrl: './ui-table.html',
  styleUrl: './ui-table.scss',
})
export class UiTable {
  readonly columns = input.required<UiTableColumn[]>();
  readonly rows = input.required<UiTableRow[]>();
  readonly loading = input(false);
  readonly loadingTitle = input('Cargando');
  readonly loadingSubtitle = input('');
  readonly loadingLabel = input('Cargando');
  readonly emptyTitle = input('No hay resultados');
  readonly caption = input('');
  readonly heading = input('');
  readonly selectedId = input<string | null>(null);
  readonly selectedIdChange = output<string | null>();
  readonly pageSizeOptions = input<readonly number[]>([10, 20, 50]);
  readonly initialPageSize = input(10);
  readonly sizeOpen = signal(false);

  readonly pageSize = linkedSignal(() => this.initialPageSize());
  readonly page = signal(1);

  private lastRowKey = '';

  readonly total = computed(() => this.rows().length);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize()) || 1));
  readonly pagedRows = computed(() => {
    const size = this.pageSize();
    const start = (this.page() - 1) * size;
    return this.rows().slice(start, start + size);
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
  readonly showPager = computed(() => !this.loading() && this.total() > 0);

  constructor() {
    effect(() => {
      const key = this.rows()
        .map((row) => row.id)
        .join('|');
      const size = this.pageSize();
      untracked(() => {
        if (key !== this.lastRowKey) {
          this.lastRowKey = key;
          this.page.set(1);
        }
        const pages = Math.max(1, Math.ceil(this.rows().length / size) || 1);
        if (this.page() > pages) this.page.set(pages);
      });
    });
  }

  cell(row: UiTableRow, columnId: string): UiTableCell {
    const raw = row.cells[columnId];
    if (raw == null) return { text: '—' };
    if (typeof raw === 'string') return { text: raw || '—' };
    return { ...raw, text: raw.text || '—' };
  }

  setPageSize(size: number): void {
    if (!this.pageSizeOptions().includes(size)) return;
    this.pageSize.set(size);
    this.page.set(1);
  }

  pickPageSize(size: number): void {
    this.setPageSize(size);
    this.sizeOpen.set(false);
  }

  toggleSize(): void {
    this.sizeOpen.update((open) => !open);
  }

  closeSize(): void {
    this.sizeOpen.set(false);
  }

  selectRow(row: UiTableRow): void {
    this.selectedIdChange.emit(this.selectedId() === row.id ? null : row.id);
  }

  alignClass(align: UiTableAlign | undefined): string {
    if (align === 'left') return 'ui-table__cell--left';
    if (align === 'right') return 'ui-table__cell--right';
    return '';
  }

  goToPage(page: number): void {
    const next = Math.min(this.totalPages(), Math.max(1, page));
    this.page.set(next);
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
}
