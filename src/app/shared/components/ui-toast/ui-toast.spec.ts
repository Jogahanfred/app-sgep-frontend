import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';
import { UiToast } from './ui-toast';

describe('UiToast', () => {
  it('muestra un aviso y se puede cerrar', () => {
    TestBed.configureTestingModule({
      imports: [UiToast],
    });
    const toast = TestBed.inject(ToastService);
    toast.clear();
    const fixture = TestBed.createComponent(UiToast);
    toast.success('Persona creada', 'La persona ya puede ingresar al sistema.', 0);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Persona creada');
    expect(root.textContent).toContain('La persona ya puede ingresar al sistema.');
    const close = root.querySelector('[aria-label="Cerrar aviso"]') as HTMLButtonElement;
    close.click();
    fixture.detectChanges();
    expect(root.textContent).not.toContain('Persona creada');
    expect(root.textContent).not.toContain('La persona ya puede ingresar al sistema.');
  });
});
