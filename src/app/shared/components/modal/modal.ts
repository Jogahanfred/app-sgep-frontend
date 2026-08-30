import { ChangeDetectionStrategy, Component, DestroyRef, effect, ElementRef, inject, input, output, viewChild } from '@angular/core';
import { DocumentScrollLock } from '@shared/utils/document-scroll-lock';
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
  private readonly scrollLock = inject(DocumentScrollLock);
  private locked = false;
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly size = input<'md' | 'lg' | 'xl' | 'full'>('md');
  readonly closed = output<void>();
  readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    inject(DestroyRef).onDestroy(() => this.releaseScroll());
    effect(() => {
      const el = this.dialog()?.nativeElement;
      if (!el) return;
      if (this.open()) {
        this.holdScroll();
        if (!el.open) {
          el.showModal();
        }
        const closeBtn = this.host.nativeElement.querySelector('[data-close]');
        if (closeBtn instanceof HTMLElement) {
          closeBtn.focus();
        }
      } else {
        if (el.open) {
          el.close();
        }
        this.releaseScroll();
      }
    });
  }

  private holdScroll(): void {
    if (this.locked) return;
    this.scrollLock.lock();
    this.locked = true;
  }

  private releaseScroll(): void {
    if (!this.locked) return;
    this.scrollLock.unlock();
    this.locked = false;
  }

  close(): void {
    this.closed.emit();
  }

  onCancel(event: Event): void {
    event.preventDefault();
    this.close();
  }
}
