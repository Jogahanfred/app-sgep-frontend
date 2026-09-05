import { TestBed } from '@angular/core/testing';
import { UiSwitchList } from './ui-switch-list';

describe('UiSwitchList', () => {
  it('habilita un curso de la lista', () => {
    TestBed.configureTestingModule({ imports: [UiSwitchList] });
    const fixture = TestBed.createComponent(UiSwitchList);
    fixture.componentRef.setInput('items', [
      { id: 'math', title: 'Matemática', hint: '12 h' },
      { id: 'phys', title: 'Física' },
    ]);
    fixture.componentRef.setInput('enabledIds', ['phys']);
    fixture.detectChanges();
    const changed: string[][] = [];
    fixture.componentInstance.enabledIdsChange.subscribe((ids) => changed.push(ids));
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Matemática');
    (root.querySelector('#switch-math') as HTMLButtonElement).click();
    expect(changed[0]).toEqual(['phys', 'math']);
  });
});
