import { DocumentScrollLock } from './document-scroll-lock';

describe('DocumentScrollLock', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('style');
    document.documentElement.classList.remove('is-scroll-locked');
    document.body.removeAttribute('style');
  });

  it('bloquea el overflow sin cambiar la posición del documento', () => {
    const lock = new DocumentScrollLock();
    lock.lock();
    expect(document.documentElement.classList.contains('is-scroll-locked')).toBe(true);
    expect(document.documentElement.style.overflow).toBe('hidden');
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.position).toBe('');
    lock.lock();
    expect(document.body.style.overflow).toBe('hidden');
    lock.unlock();
    expect(document.body.style.overflow).toBe('hidden');
    lock.unlock();
    expect(document.documentElement.classList.contains('is-scroll-locked')).toBe(false);
    expect(document.body.style.overflow).toBe('');
  });
});
