import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { matchesAdminSearch } from '@core/domain/services/admin-catalog';
import { Button } from '@shared/components/button/button';
import { Modal } from '@shared/components/modal/modal';
import { UiCheckbox } from '@shared/components/ui-checkbox/ui-checkbox';
import { UiInput } from '@shared/components/ui-input/ui-input';
import type { ProgramStandardOption } from '../../shared/models/program-standard-matrix.types';

@Component({
  selector: 'app-standard-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Modal, UiCheckbox, UiInput],
  templateUrl: './standard-picker.html',
  styleUrl: './standard-picker.scss',
})
export class StandardPicker {
  readonly open = input(false);
  readonly contextTitle = input.required<string>();
  readonly contextDetail = input.required<string>();
  readonly standards = input.required<readonly ProgramStandardOption[]>();
  readonly selectedIds = input<readonly string[]>([]);
  readonly selectedIdsChange = output<string[]>();
  readonly applied = output<string[]>();
  readonly closed = output<void>();

  readonly search = new FormControl('', { nonNullable: true });
  readonly query = signal('');
  readonly selectedCount = computed(() => this.selectedIds().length);
  readonly filteredStandards = computed(() =>
    this.standards().filter((standard) =>
      matchesAdminSearch([standard.code, standard.name, standard.description], this.query()),
    ),
  );

  constructor() {
    const destroyRef = inject(DestroyRef);
    this.search.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe((value) => this.query.set(value));
  }

  isSelected(id: string): boolean {
    return this.selectedIds().includes(id);
  }

  toggle(id: string, checked: boolean): void {
    const next = new Set(this.selectedIds());
    if (checked) next.add(id);
    else next.delete(id);
    this.selectedIdsChange.emit([...next]);
  }

  clear(): void {
    this.selectedIdsChange.emit([]);
  }

  apply(): void {
    this.applied.emit([...this.selectedIds()]);
    this.resetSearch();
  }

  cancel(): void {
    this.resetSearch();
    this.closed.emit();
  }

  private resetSearch(): void {
    this.search.setValue('', { emitEvent: false });
    this.query.set('');
  }
}
