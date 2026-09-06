import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { ClientSession } from '@layout/client-session.service';
import type { OperationalContext } from '@core/domain/entities/operational-context';
import { PERSONNEL_DOSSIER_COPY } from '../../../constants/personnel-dossier.copy.constants';
import { PersonnelDossierListPage } from './personnel-dossier-list.page';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

const adsys: OperationalContext = {
  userId: 'usr-elena-martin',
  displayName: 'Elena Martín Ruiz',
  roleCode: 'ADSYS',
  assignedUnitId: null,
  assignedSquadronId: null,
  unitId: 'unit-norte',
  squadronId: 'sq-alfa',
  coversAllSquadrons: false,
};

async function waitReady(fixture: ComponentFixture<PersonnelDossierListPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 8000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('PersonnelDossierListPage', () => {
  it('lista legajos del contexto', async () => {
    sessionStorage.clear();
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [PersonnelDossierListPage],
      providers: [provideRouter([]), ...CORE_PROVIDERS],
    }).compileComponents();
    TestBed.inject(ClientSession).confirmContext(adsys);

    const fixture = TestBed.createComponent(PersonnelDossierListPage);
    await waitReady(fixture);
    const root = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance.loadState()).toBe('ready');
    expect(root.textContent).toContain(PERSONNEL_DOSSIER_COPY.tableHeading);
    expect(root.textContent).toContain('Sofía');
    expect(root.querySelector('.pdl__open')).not.toBeNull();
    expect(root.textContent).toContain('Mostrando 1 - 9 de');
    expect(root.querySelector('.pdl__pager')).not.toBeNull();
    expect(root.querySelector('.pdl__id')).not.toBeNull();
    expect(root.textContent).toMatch(/O-\d{5}-/);
    expect(root.querySelector('.pdl__id-caducidad')?.textContent).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});
