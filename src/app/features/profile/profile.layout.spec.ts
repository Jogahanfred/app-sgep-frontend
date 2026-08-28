import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProfileLayout } from './profile.layout';

describe('ProfileLayout', () => {
  it('ofrece la navegación de administración dentro del perfil', async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileLayout],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProfileLayout);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Mi perfil');
    expect(text).toContain('Usuarios');
    expect(text).toContain('Roles');
    expect(text).toContain('Especialidades');
    expect(text).toContain('Seguridad y administración');
  });
});
