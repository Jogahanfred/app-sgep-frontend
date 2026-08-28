import { ChangeDetectionStrategy, Component, effect, ElementRef, inject, input, output, viewChild } from '@angular/core';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
})
export class Modal {
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly closed = output<void>();
  readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const el = this.dialog()?.nativeElement;
      if (!el) return;
      if (this.open() && !el.open) {
        el.showModal();
        const closeBtn = this.host.nativeElement.querySelector('[data-close]');
        if (closeBtn instanceof HTMLElement) {
          closeBtn.focus();
        }
      } else if (!this.open() && el.open) {
        el.close();
      }
    });
  }

  close(): void {
    this.closed.emit();
  }

  onCancel(event: Event): void {
    event.preventDefault();
    this.close();
  }
}
