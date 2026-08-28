import { TestBed } from '@angular/core/testing';
import { UiConfirmDialog } from './ui-confirm-dialog';

describe('UiConfirmDialog', () => {
  beforeEach(async () => {
    if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
      HTMLDialogElement.prototype.showModal = function showModal() {
        this.setAttribute('open', '');
      };
      HTMLDialogElement.prototype.close = function close() {
        this.removeAttribute('open');
      };
    }
    await TestBed.configureTestingModule({
      imports: [UiConfirmDialog],
    }).compileComponents();
  });

  it('confirma y cancela', () => {
    const fixture = TestBed.createComponent(UiConfirmDialog);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('title', 'Confirmar baja');
    fixture.componentRef.setInput('message', '¿Seguro que quieres dar de baja a Elena?');
    fixture.componentRef.setInput('confirmLabel', 'Dar de baja');
    const confirmed: string[] = [];
    const closed: string[] = [];
    fixture.componentInstance.confirmed.subscribe(() => confirmed.push('ok'));
    fixture.componentInstance.closed.subscribe(() => closed.push('no'));
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Confirmar baja');
    expect(root.textContent).toContain('Elena');

    const buttons = Array.from(root.querySelectorAll('button'));
    const confirm = buttons.find((button) => (button.textContent ?? '').includes('Dar de baja'));
    const cancel = buttons.find((button) => (button.textContent ?? '').includes('Cancelar'));
    confirm?.click();
    cancel?.click();
    expect(confirmed).toEqual(['ok']);
    expect(closed).toEqual(['no']);
  });
});
