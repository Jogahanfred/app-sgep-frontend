import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { UiTextarea } from './ui-textarea';

describe('UiTextarea', () => {
  it('pinta un textarea con la etiqueta del modelo', async () => {
    await TestBed.configureTestingModule({
      imports: [UiTextarea],
    }).compileComponents();

    const fixture = TestBed.createComponent(UiTextarea);
    fixture.componentRef.setInput('id', 'motivo');
    fixture.componentRef.setInput('label', 'Motivo');
    fixture.componentRef.setInput('field', new FormControl('Apoyo al relevo.', { nonNullable: true }));
    fixture.detectChanges();

    const area = fixture.nativeElement.querySelector('textarea#motivo') as HTMLTextAreaElement;
    expect(area).not.toBeNull();
    expect(area.value).toBe('Apoyo al relevo.');
    expect(fixture.nativeElement.textContent).toContain('Motivo');
  });
});
