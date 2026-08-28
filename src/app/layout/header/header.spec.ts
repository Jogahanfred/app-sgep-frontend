import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Header } from './header';

describe('Header', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('muestra la marca y los CTA principales', async () => {
    const fixture = TestBed.createComponent(Header);
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Helvia');
    expect(text).toContain('Acceso clientes');
    expect(text).toContain('Hazte cliente');
    expect(text).toContain('Particulares');
  });

  it('abre el menú móvil', async () => {
    const fixture = TestBed.createComponent(Header);
    const component = fixture.componentInstance;
    expect(component.mobileOpen()).toBe(false);
    component.toggleMobile();
    expect(component.mobileOpen()).toBe(true);
  });
});
