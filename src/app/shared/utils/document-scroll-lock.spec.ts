import { vi } from 'vitest';
import { DocumentScrollLock } from './document-scroll-lock';

describe('DocumentScrollLock', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('style');
    document.documentElement.classList.remove('is-scroll-locked');
    document.body.removeAttribute('style');
    vi.restoreAllMocks();
  });

  it('fija el documento y no acumula el bloqueo anidado', () => {
    const lock = new DocumentScrollLock();
    lock.lock();
    expect(document.documentElement.classList.contains('is-scroll-locked')).toBe(true);
    expect(document.body.style.position).toBe('fixed');
    lock.lock();
    expect(document.body.style.position).toBe('fixed');
    lock.unlock();
    expect(document.body.style.position).toBe('fixed');
    lock.unlock();
    expect(document.documentElement.classList.contains('is-scroll-locked')).toBe(false);
    expect(document.body.style.position).toBe('');
  });

  it('restaura el scroll al desbloquear', () => {
    const lock = new DocumentScrollLock();
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(120);
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    lock.lock();
    expect(document.body.style.top).toBe('-120px');
    lock.unlock();
    expect(scrollTo).toHaveBeenCalledWith(0, 120);
  });
});
