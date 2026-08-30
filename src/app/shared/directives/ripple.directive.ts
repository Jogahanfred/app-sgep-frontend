import { Directive, ElementRef, inject, input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appRipple]',
  host: {
    class: 'app-ripple-host',
    '(pointerdown)': 'spawn($event)',
  },
})
export class RippleDirective {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  readonly appRippleDisabled = input(false);

  spawn(event: PointerEvent): void {
    if (this.appRippleDisabled() || event.button !== 0) return;
    if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const root = this.host.nativeElement;
    const rect = root.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const size = Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y)) * 2;

    this.drop(root, 'app-ripple--wash', (node) => {
      node.style.setProperty('--ripple-x', `${x}px`);
      node.style.setProperty('--ripple-y', `${y}px`);
    });
    this.drop(root, 'app-ripple', (node) => {
      this.renderer.setStyle(node, 'left', `${x}px`);
      this.renderer.setStyle(node, 'top', `${y}px`);
      this.renderer.setStyle(node, 'width', `${size}px`);
      this.renderer.setStyle(node, 'height', `${size}px`);
    });
    this.drop(root, 'app-ripple app-ripple--ring', (node) => {
      this.renderer.setStyle(node, 'left', `${x}px`);
      this.renderer.setStyle(node, 'top', `${y}px`);
      this.renderer.setStyle(node, 'width', `${size}px`);
      this.renderer.setStyle(node, 'height', `${size}px`);
    });
  }

  private drop(root: HTMLElement, className: string, decorate: (node: HTMLElement) => void): void {
    const node = this.renderer.createElement('span') as HTMLElement;
    for (const name of className.split(' ')) {
      this.renderer.addClass(node, name);
    }
    decorate(node);
    this.renderer.appendChild(root, node);
    const cleanup = () => {
      node.removeEventListener('animationend', cleanup);
      if (node.parentNode) this.renderer.removeChild(root, node);
    };
    node.addEventListener('animationend', cleanup);
  }
}
