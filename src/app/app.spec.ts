import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { CORE_PROVIDERS } from './core/di/providers';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), ...CORE_PROVIDERS],
    }).compileComponents();
  });

  it('crea el cascarón con cabecera y pie', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance).toBeTruthy();
    expect(el.querySelector('app-header')).toBeTruthy();
    expect(el.querySelector('app-footer')).toBeTruthy();
    expect(el.querySelector('#contenido-principal')).toBeTruthy();
  });
});
