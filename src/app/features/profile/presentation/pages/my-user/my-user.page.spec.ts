import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { ClientSession } from '../../../../../layout/client-session.service';
import { MyUserPage } from './my-user.page';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

async function waitReady(fixture: ComponentFixture<MyUserPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 2000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('MyUserPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyUserPage],
      providers: [provideRouter([]), ...CORE_PROVIDERS],
    }).compileComponents();
    TestBed.inject(ClientSession).signIn('Elena');
  });

  it('carga la ficha de la persona logueada', async () => {
    const fixture = TestBed.createComponent(MyUserPage);
    await waitReady(fixture);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Usuario');
    expect(text).toContain('Nombres');
    expect(fixture.componentInstance.form.controls.firstName.value).toBe('Elena');
    expect(fixture.componentInstance.form.controls.documentNumber.value).toBe('25198467M');
    expect(text).not.toContain('Sprint');
  });
});
