import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { ClientSession } from '@layout/client-session.service';
import { DailyDispatchPage } from './daily-dispatch.page';
import { DISPATCH_COPY } from '../../../constants/dispatch.copy.constants';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

async function waitReady(fixture: ComponentFixture<DailyDispatchPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 8000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

function stubDialog(): void {
  if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function close() {
      this.removeAttribute('open');
    };
  }
}

describe('DailyDispatchPage', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    localStorage.clear();
    stubDialog();
    await TestBed.configureTestingModule({
      imports: [DailyDispatchPage],
      providers: [provideRouter([]), ...CORE_PROVIDERS],
    }).compileComponents();
    TestBed.inject(ClientSession).confirmContext({
      userId: 'usr-elena-martin',
      displayName: 'Elena Martín Ruiz',
      roleCode: 'ADSYS',
      assignedUnitId: null,
      assignedSquadronId: null,
      unitId: 'unit-norte',
      squadronId: 'sq-alfa',
      coversAllSquadrons: false,
    });
  });

  it('muestra el tablero del día y el slot listo para despachar', async () => {
    const fixture = TestBed.createComponent(DailyDispatchPage);
    await waitReady(fixture);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain(DISPATCH_COPY.protocolTitle);
    expect(text).toContain('Diego Molina');
    expect(text).toContain('Nuria Beltrán');
    expect(text).toContain('Alba Ferrer');
    expect(text).toContain(DISPATCH_COPY.actionDispatch);
    expect(text).toContain(DISPATCH_COPY.kindAirborne);
  });
});
