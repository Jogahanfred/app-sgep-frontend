import { Directive, ElementRef, inject, input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appRipple]',
  host: {
    class: 'app-ripple-host',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointerup)': 'releasePointer()',
    '(pointercancel)': 'releasePointer()',
    '(focusin)': 'onFocusIn()',
  },
})
export class RippleDirective {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private fromPointer = false;
  readonly appRippleDisabled = input(false);

  onPointerDown(event: PointerEvent): void {
    if (this.appRippleDisabled() || event.button !== 0) return;
    this.fromPointer = true;
    this.sweep();
  }

  onFocusIn(): void {
    if (this.appRippleDisabled()) return;
    if (this.fromPointer) {
      this.fromPointer = false;
      return;
    }
    this.sweep();
  }

  releasePointer(): void {
    requestAnimationFrame(() => {
      this.fromPointer = false;
    });
  }

  private sweep(): void {
    if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const root = this.host.nativeElement;
    const node = this.renderer.createElement('span') as HTMLElement;
    this.renderer.addClass(node, 'app-ripple');
    this.renderer.appendChild(root, node);
    const cleanup = () => {
      node.removeEventListener('animationend', cleanup);
      if (node.parentNode) this.renderer.removeChild(root, node);
    };
    node.addEventListener('animationend', cleanup);
  }
}
