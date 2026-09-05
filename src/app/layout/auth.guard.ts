import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { LOGIN_DEFAULT_NEXT_URL } from './login-screen/login-screen.constants';
import { LOGIN_ROUTE, PROFILE_CONTEXT_ROUTE, safeInternalUrl } from './auth-routes.constants';
import { ClientSession } from './client-session.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const session = inject(ClientSession);
  const router = inject(Router);
  if (session.loggedIn()) return true;
  return router.createUrlTree([LOGIN_ROUTE], { queryParams: { next: state.url } });
};

export const operationalContextGuard: CanActivateFn = (_route, state) => {
  const session = inject(ClientSession);
  const router = inject(Router);
  if (!session.loggedIn()) {
    return router.createUrlTree([LOGIN_ROUTE], { queryParams: { next: state.url } });
  }
  if (!session.hasOperationalContext()) {
    return router.createUrlTree([PROFILE_CONTEXT_ROUTE], { queryParams: { next: state.url } });
  }
  return true;
};

export const guestGuard: CanActivateFn = (_route, state) => {
  const session = inject(ClientSession);
  const router = inject(Router);
  if (!session.loggedIn()) return true;
  const next = safeInternalUrl(router.parseUrl(state.url).queryParams['next'], LOGIN_DEFAULT_NEXT_URL);
  if (!session.hasOperationalContext()) {
    return router.createUrlTree([PROFILE_CONTEXT_ROUTE], { queryParams: { next } });
  }
  return router.createUrlTree([next]);
};
