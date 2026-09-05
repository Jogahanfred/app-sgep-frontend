import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { Alert } from '../alert/alert';
import { Button } from '../button/button';
import { Icon, type IconName } from '../icon/icon';
import { UiCheckbox } from '../ui-checkbox/ui-checkbox';
import type { UiPlannerPhase, UiPlannerMissionStatus } from '@shared/types/ui-planner-tree.types';

@Component({
  selector: 'ui-curriculum-tree',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Button, Icon, UiCheckbox],
  templateUrl: './ui-curriculum-tree.html',
  styleUrl: './ui-curriculum-tree.scss',
})
export class UiCurriculumTree {
  readonly programTitle = input.required<string>();
  readonly programMeta = input('');
  readonly phases = input.required<readonly UiPlannerPhase[]>();
  readonly selectedId = input<string | null>(null);
  readonly legend = input<readonly { status: UiPlannerMissionStatus; label: string }[]>([]);
  readonly emptyLabel = input('');
  readonly selectedChange = output<string>();
  readonly scheduleClick = output<string>();
  readonly phaseSelectChange = output<{ id: string; selected: boolean }>();

  private readonly collapsed = signal<ReadonlySet<string>>(new Set());
  private readonly collapsedSubs = signal<ReadonlySet<string>>(new Set());
  private lastPhaseKey = '';

  constructor() {
    effect(() => {
      const phases = this.phases();
      const key = phases.map((phase) => phase.id).join('|');
      untracked(() => {
        if (key === this.lastPhaseKey) return;
        this.lastPhaseKey = key;
        this.collapsed.set(new Set());
        this.collapsedSubs.set(new Set());
      });
    });
  }

  readonly openPhaseIds = computed(() => {
    const closed = this.collapsed();
    return this.phases()
      .filter((phase) => !closed.has(phase.id))
      .map((phase) => phase.id);
  });

  isOpen(phaseId: string): boolean {
    return this.openPhaseIds().includes(phaseId);
  }

  toggle(phaseId: string): void {
    const next = new Set(this.collapsed());
    if (next.has(phaseId)) next.delete(phaseId);
    else next.add(phaseId);
    this.collapsed.set(next);
  }

  isSubOpen(subphaseId: string): boolean {
    return !this.collapsedSubs().has(subphaseId);
  }

  toggleSub(subphaseId: string): void {
    const next = new Set(this.collapsedSubs());
    if (next.has(subphaseId)) next.delete(subphaseId);
    else next.add(subphaseId);
    this.collapsedSubs.set(next);
  }

  pick(id: string): void {
    this.selectedChange.emit(id);
  }

  schedule(id: string, event: Event): void {
    event.stopPropagation();
    this.scheduleClick.emit(id);
  }

  setPhaseSelected(id: string, selected: boolean): void {
    this.phaseSelectChange.emit({ id, selected });
  }

  statusIcon(status: UiPlannerMissionStatus): IconName {
    if (status === 'completed') return 'check';
    if (status === 'blocked') return 'lock';
    if (status === 'scheduled') return 'calendar';
    return 'arrow-right';
  }
}
