import { TestBed } from '@angular/core/testing';
import { SegmentedPills } from './segmented-pills';

describe('SegmentedPills', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SegmentedPills],
    }).compileComponents();
  });

  it('resalta la pastilla activa', () => {
    const fixture = TestBed.createComponent(SegmentedPills);
    fixture.componentRef.setInput('label', 'Antigüedad');
    fixture.componentRef.setInput('value', 'lt2');
    fixture.componentRef.setInput('options', [
      { value: 'lt2', label: 'Menos de 2 años' },
      { value: 'gt5', label: 'Más de 5 años' },
    ]);
    fixture.detectChanges();

    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('button');
    expect(buttons[0].classList.contains('sp__btn--on')).toBe(true);
    expect(buttons[1].classList.contains('sp__btn--on')).toBe(false);
  });
});
