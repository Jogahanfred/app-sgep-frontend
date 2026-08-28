import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { ClientSession } from '../../layout/client-session.service';
import { MyAssignmentsPage } from './my-assignments.page';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

async function waitReady(fixture: ComponentFixture<MyAssignmentsPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 2000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('MyAssignmentsPage', () => {
  it('muestra solo los roles de la persona logueada', async () => {
    await TestBed.configureTestingModule({
      imports: [MyAssignmentsPage],
      providers: [
        provideRouter([]),
        ...CORE_PROVIDERS,
        { provide: ActivatedRoute, useValue: { snapshot: { data: { assignments: 'roles' } } } },
      ],
    }).compileComponents();
    TestBed.inject(ClientSession).signIn('Elena');

    const fixture = TestBed.createComponent(MyAssignmentsPage);
    await waitReady(fixture);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Administrador');
    expect(text).not.toContain('Director Académico');
    expect(text).not.toContain('Sprint');
  });
});
