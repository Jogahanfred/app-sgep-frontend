import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { UiPosterField } from './ui-poster-field';

describe('UiPosterField', () => {
  it('muestra el cuadro vacío, el póster y rechaza un archivo que no es imagen', () => {
    TestBed.configureTestingModule({ imports: [UiPosterField] });
    const fixture = TestBed.createComponent(UiPosterField);
    fixture.componentRef.setInput('label', 'Póster del programa');
    fixture.detectChanges();

    const rejected = vi.fn();
    fixture.componentInstance.reject.subscribe(rejected);
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Póster del programa');
    expect(root.textContent).toContain('Subir imagen o póster');
    expect(root.querySelector('img')).toBeNull();
    expect(root.querySelector('input[type="file"]')).not.toBeNull();

    fixture.componentRef.setInput('value', '/programs/ppl.jpg');
    fixture.detectChanges();
    expect(root.querySelector('img')?.getAttribute('src')).toBe('/programs/ppl.jpg');
    expect(root.textContent).toContain('Cambiar póster');

    fixture.componentInstance.onFile({
      target: { files: [new File(['x'], 'nota.txt', { type: 'text/plain' })], value: '' },
    } as unknown as Event);
    expect(rejected).toHaveBeenCalledWith('Elige una imagen JPEG, PNG o WebP.');
  });
});
