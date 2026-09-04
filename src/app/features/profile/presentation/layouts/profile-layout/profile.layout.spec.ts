import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProfileLayout } from './profile.layout';

describe('ProfileLayout', () => {
  it('navega la cuenta de la persona logueada, no el catálogo', async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileLayout],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProfileLayout);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Mi perfil');
    expect(text).toContain('Usuario');
    expect(text).toContain('Roles');
    expect(text).toContain('Especialidades');
    expect(text).toContain('Tu cuenta');
    expect(text).not.toContain('Sprint');
    expect(text).not.toContain('Catálogo');
  });
});
