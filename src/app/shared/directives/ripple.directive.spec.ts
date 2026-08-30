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
  it('barre de izquierda a derecha al pulsar y se retira al terminar', () => {
    const fixture = TestBed.createComponent(RippleHost);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    button.dispatchEvent(new PointerEvent('pointerdown', { button: 0, clientX: 24, clientY: 12, bubbles: true }));

    const waves = button.querySelectorAll('.app-ripple');
    expect(waves.length).toBe(1);

    waves[0].dispatchEvent(new Event('animationend'));
    expect(button.querySelector('.app-ripple')).toBeNull();
  });

  it('barre al recibir el foco con Tab', () => {
    const fixture = TestBed.createComponent(RippleHost);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(button.querySelectorAll('.app-ripple').length).toBe(1);
  });

  it('no duplica la onda si el clic ya disparó el barrido', () => {
    const fixture = TestBed.createComponent(RippleHost);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.dispatchEvent(new PointerEvent('pointerdown', { button: 0, clientX: 8, clientY: 8, bubbles: true }));
    button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(button.querySelectorAll('.app-ripple').length).toBe(1);
  });

  it('no anima si el control está desactivado', () => {
    const fixture = TestBed.createComponent(RippleHost);
    fixture.componentInstance.disabled = true;
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.dispatchEvent(new PointerEvent('pointerdown', { button: 0, clientX: 8, clientY: 8, bubbles: true }));
    button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(button.querySelector('.app-ripple')).toBeNull();
  });
});
