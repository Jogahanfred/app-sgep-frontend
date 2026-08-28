import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Icon, type IconName } from '../icon/icon';
import { ToastService, type ToastTone } from './toast.service';

@Component({
  selector: 'ui-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './ui-toast.html',
  styleUrl: './ui-toast.scss',
})
export class UiToast {
  readonly toast = inject(ToastService);

  iconOf(tone: ToastTone): IconName {
    if (tone === 'error') return 'warning';
    if (tone === 'info') return 'info';
    return 'check';
  }
}
