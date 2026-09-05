import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RippleDirective } from '@shared/directives/ripple.directive';
import { Button } from '../button/button';
import { Icon } from '../icon/icon';
import { UiAvatar } from '../ui-avatar/ui-avatar';
import { UiChip } from '../ui-chip/ui-chip';
import { UiProgress } from '../ui-progress/ui-progress';

@Component({
  selector: 'ui-person-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RippleDirective, Button, Icon, UiAvatar, UiChip, UiProgress],
  templateUrl: './ui-person-card.html',
  styleUrl: './ui-person-card.scss',
})
export class UiPersonCard {
  readonly name = input.required<string>();
  readonly meta = input('');
  readonly badge = input('');
  readonly photoUrl = input<string | null>(null);
  readonly selected = input(false);
  readonly marker = input(false);
  readonly actionLabel = input('');
  readonly actionDisabled = input(false);
  readonly progressValue = input(0);
  readonly progressCaption = input('');
  readonly progressValueLabel = input('');
  readonly highlightLabel = input('');
  readonly highlightText = input('');
  readonly highlightHint = input('');
  readonly tags = input<readonly string[]>([]);
  readonly selectedChange = output<void>();
  readonly actionClick = output<void>();

  pick(): void {
    this.selectedChange.emit();
  }

  runAction(event: Event): void {
    event.stopPropagation();
    if (this.actionDisabled()) return;
    this.actionClick.emit();
  }
}
