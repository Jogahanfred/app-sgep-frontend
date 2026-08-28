import { TestBed } from '@angular/core/testing';
import { ChoiceGroup } from './choice-group';

describe('ChoiceGroup', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChoiceGroup],
    }).compileComponents();
  });

  it('marca la opción activa y emite al elegir otra', async () => {
    const fixture = TestBed.createComponent(ChoiceGroup);
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
});
