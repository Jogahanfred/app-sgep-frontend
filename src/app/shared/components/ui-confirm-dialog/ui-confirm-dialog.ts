import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Button } from '../button/button';
import { Modal } from '../modal/modal';

@Component({
  selector: 'ui-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Modal],
  templateUrl: './ui-confirm-dialog.html',
  styleUrl: './ui-confirm-dialog.scss',
})
export class UiConfirmDialog {
  readonly open = input(false);
  readonly title = input('Confirmar');
  readonly message = input.required<string>();
  readonly confirmLabel = input('Confirmar');
  readonly cancelLabel = input('Cancelar');
  readonly closed = output<void>();
  readonly confirmed = output<void>();

  onClose(): void {
    this.closed.emit();
  }

  onConfirm(): void {
    this.confirmed.emit();
  }
}
