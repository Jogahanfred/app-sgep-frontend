import { TestBed } from '@angular/core/testing';
import { UiAvatar } from './ui-avatar';

describe('UiAvatar', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiAvatar],
    }).compileComponents();
  });

  it('muestra iniciales por defecto y aplica tamaño y radio', () => {
    const fixture = TestBed.createComponent(UiAvatar);
    fixture.componentRef.setInput('name', 'Elisa Mora Gil');
    fixture.componentRef.setInput('size', 'md');
    fixture.componentRef.setInput('radius', 'md');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('EM');
    expect(root.querySelector('.av--md')).not.toBeNull();
    expect(root.querySelector('.av__marker')).toBeNull();
    expect(fixture.componentInstance.radiusCss()).toBe('var(--radius-md)');
  });

  it('usa la foto cuando hay origen y el marcador solo si se pide', () => {
    const fixture = TestBed.createComponent(UiAvatar);
    fixture.componentRef.setInput('name', 'Elisa Mora Gil');
    fixture.componentRef.setInput('src', '/photos/elisa.jpg');
    fixture.componentRef.setInput('marker', true);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('img')?.getAttribute('src')).toBe('/photos/elisa.jpg');
    expect(root.querySelector('.av__marker')).not.toBeNull();
  });
});
