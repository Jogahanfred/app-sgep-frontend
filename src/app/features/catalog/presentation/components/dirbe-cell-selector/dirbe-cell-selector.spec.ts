import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DirbeCellSelector } from './dirbe-cell-selector';

describe('DirbeCellSelector', () => {
  async function createFixture(): Promise<ComponentFixture<DirbeCellSelector>> {
    await TestBed.configureTestingModule({ imports: [DirbeCellSelector] }).compileComponents();
    return TestBed.createComponent(DirbeCellSelector);
  }

  it('abre la edición al pulsar el cuadrante sin renderizar controles adicionales', async () => {
    const fixture = await createFixture();
    const emitted: void[] = [];
    fixture.componentInstance.editRequested.subscribe(() => emitted.push(undefined));
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('select')).toBeNull();
    expect(root.querySelector('app-icon')).toBeNull();

    const button = root.querySelector('button') as HTMLButtonElement;
    expect(button.textContent).toContain('+');
    expect(button.hasAttribute('title')).toBe(false);
    button.click();

    expect(emitted).toHaveLength(1);
  });

  it('muestra únicamente el nivel dentro del recuadro coloreado', async () => {
    const fixture = await createFixture();
    fixture.componentRef.setInput('value', 'B');
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement;
    expect(button.classList.contains('dcs--b')).toBe(true);
    expect(button.textContent?.trim()).toBe('B');
  });

  it('bloquea la apertura mientras la matriz está guardando', async () => {
    const fixture = await createFixture();
    const emitted: void[] = [];
    fixture.componentInstance.editRequested.subscribe(() => emitted.push(undefined));
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    button.click();

    expect(emitted).toHaveLength(0);
  });
});
