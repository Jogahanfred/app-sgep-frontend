import { TestBed } from '@angular/core/testing';
import { UiAssignBlock } from './ui-assign-block';

describe('UiAssignBlock', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiAssignBlock],
    }).compileComponents();
  });

  it('separa un bloque con título, ayuda y recuento', () => {
    const fixture = TestBed.createComponent(UiAssignBlock);
    fixture.componentRef.setInput('title', 'Misiones');
    fixture.componentRef.setInput('hint', 'Qué sesiones vuela el alumno.');
    fixture.componentRef.setInput('countLabel', '2 misiones');
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Misiones');
    expect(text).toContain('Qué sesiones vuela el alumno.');
    expect(text).toContain('2 misiones');
  });
});
