import { TestBed } from '@angular/core/testing';
import { UiRadioCardGroup } from './ui-radio-card-group';

describe('UiRadioCardGroup', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiRadioCardGroup],
    }).compileComponents();
  });

  it('marca la opción activa y emite al elegir otra', async () => {
    const fixture = TestBed.createComponent(UiRadioCardGroup);
    const emitted: string[] = [];
    fixture.componentRef.setInput('id', 'house');
    fixture.componentRef.setInput('question', '¿Has encontrado ya la casa que quieres?');
    fixture.componentRef.setInput('options', [
      { value: 'searching', label: 'Todavía estoy buscando.' },
      { value: 'reserved', label: 'Sí, la tengo elegida y reservada.' },
    ]);
    fixture.componentRef.setInput('value', 'reserved');
    fixture.componentInstance.valueChange.subscribe((value) => emitted.push(value));
    fixture.detectChanges();

    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('button');
    expect(buttons[1].getAttribute('aria-checked')).toBe('true');
    buttons[0].dispatchEvent(new Event('click'));
    expect(emitted).toEqual(['searching']);
  });

  it('usa el mismo alto que ui-input', () => {
    const fixture = TestBed.createComponent(UiRadioCardGroup);
    fixture.componentRef.setInput('id', 'prg-type');
    fixture.componentRef.setInput('question', 'Tipo');
    fixture.componentRef.setInput('options', [{ value: 'PPL', label: 'PPL' }]);
    fixture.componentRef.setInput('value', 'PPL');
    fixture.detectChanges();

    const option = (fixture.nativeElement as HTMLElement).querySelector('.cg__opt') as HTMLElement;
    const styles = getComputedStyle(option);
    expect(styles.height).toMatch(/2\.5rem|40px|control-height/);
    expect(styles.minHeight).toMatch(/2\.5rem|40px|control-height/);
    expect(styles.maxHeight).toMatch(/2\.5rem|40px|control-height/);
  });
});
