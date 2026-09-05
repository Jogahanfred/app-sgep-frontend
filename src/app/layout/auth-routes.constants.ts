export const LOGIN_ROUTE_PATH = 'login';
export const PROFILE_CONTEXT_ROUTE_PATH = 'perfilamiento';
export const LOGIN_ROUTE = `/${LOGIN_ROUTE_PATH}`;
export const PROFILE_CONTEXT_ROUTE = `/${PROFILE_CONTEXT_ROUTE_PATH}`;

export const AUTH_BARE_CHROME_ROUTES = [LOGIN_ROUTE, PROFILE_CONTEXT_ROUTE] as const;

export function isBareChromeUrl(url: string): boolean {
  const path = url.split('?')[0];
  return AUTH_BARE_CHROME_ROUTES.includes(path as (typeof AUTH_BARE_CHROME_ROUTES)[number]);
}

export function safeInternalUrl(url: string | null | undefined, fallback: string): string {
  if (!url || !url.startsWith('/') || url.startsWith('//')) return fallback;
  const path = url.split('?')[0];
  if (path === LOGIN_ROUTE || path === PROFILE_CONTEXT_ROUTE) return fallback;
  return url;
}
