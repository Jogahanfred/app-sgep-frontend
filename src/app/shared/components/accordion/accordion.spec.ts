import { TestBed } from '@angular/core/testing';
import { Accordion } from './accordion';

describe('Accordion', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Accordion],
    }).compileComponents();
  });

  it('abre y cierra un panel con teclado', async () => {
    const fixture = TestBed.createComponent(Accordion);
    fixture.componentRef.setInput('items', [
      { id: 'a', question: '¿Cómo abro una cuenta?', answer: 'Desde Hazte cliente.' },
    ]);
    await fixture.whenStable();

    const button = (fixture.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-expanded')).toBe('false');

    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Desde Hazte cliente.');

    button.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });
});
