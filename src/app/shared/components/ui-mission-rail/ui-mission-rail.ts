import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon, type IconName } from '../icon/icon';
import type { UiPlannerMissionStatus, UiPlannerRailItem } from '@shared/types/ui-planner-tree.types';

@Component({
  selector: 'ui-mission-rail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './ui-mission-rail.html',
  styleUrl: './ui-mission-rail.scss',
})
export class UiMissionRail {
  readonly items = input.required<readonly UiPlannerRailItem[]>();
  readonly selectedId = input<string | null>(null);
  readonly label = input('Trayectoria');
  readonly selectedChange = output<string>();

  pick(id: string): void {
    this.selectedChange.emit(id);
  }

  statusIcon(status: UiPlannerMissionStatus): IconName {
    if (status === 'completed') return 'check';
    if (status === 'blocked') return 'lock';
    if (status === 'scheduled') return 'calendar';
    return 'arrow-right';
  }
}
