import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { ClientSession } from './client-session.service';

export const authGuard: CanActivateFn = () => {
  const session = inject(ClientSession);
  const router = inject(Router);
  if (session.loggedIn()) return true;
  return router.parseUrl('/');
};
