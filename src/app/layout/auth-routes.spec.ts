import { vi } from 'vitest';
import { authGuard, guestGuard } from './auth.guard';
import { LOGIN_ROUTE_PATH } from './auth-routes.constants';
import { routes } from '../app.routes';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

describe('rutas protegidas', () => {
  it('deja el acceso institucional público y exige sesión en el resto', () => {
    const login = routes.find((route) => route.path === LOGIN_ROUTE_PATH);
    const app = routes.find((route) => route.path === '' && Array.isArray(route.children));
    expect(login?.canActivate).toEqual([guestGuard]);
    expect(app?.canActivate).toEqual([authGuard]);
    expect(app?.children?.some((route) => route.path === '**')).toBe(true);
  });
});
