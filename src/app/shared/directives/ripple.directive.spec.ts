import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RippleDirective } from './ripple.directive';

@Component({
  imports: [RippleDirective],
  template: `<button type="button" appRipple [appRippleDisabled]="disabled" style="width: 120px; height: 40px">Fila</button>`,
})
class RippleHost {
  disabled = false;
}

describe('RippleDirective', () => {
  it('lanza la onda de agua al pulsar y la retira al terminar', () => {
    const fixture = TestBed.createComponent(RippleHost);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 120, height: 40, right: 120, bottom: 40, x: 0, y: 0, toJSON: () => undefined }) as DOMRect;

    button.dispatchEvent(new PointerEvent('pointerdown', { button: 0, clientX: 24, clientY: 12, bubbles: true }));

    const waves = button.querySelectorAll('.app-ripple, .app-ripple--wash');
    expect(waves.length).toBe(3);

    waves[0].dispatchEvent(new Event('animationend'));
    expect(button.querySelectorAll('.app-ripple, .app-ripple--wash').length).toBe(2);
  });

  it('no anima si el control está desactivado', () => {
    const fixture = TestBed.createComponent(RippleHost);
    fixture.componentInstance.disabled = true;
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.dispatchEvent(new PointerEvent('pointerdown', { button: 0, clientX: 8, clientY: 8, bubbles: true }));
    expect(button.querySelector('.app-ripple')).toBeNull();
  });
});
