export interface NavLink {
  label: string;
  href: string;
  description?: string;
}

export interface NavBlock {
  heading: string;
  links: NavLink[];
}

export interface NavColumn {
  blocks: NavBlock[];
}

export interface NavGroup {
  label: string;
  href?: string;
  columns: NavColumn[];
  matchHrefs?: readonly string[];
}

export function flattenNavLinks(group: NavGroup): NavLink[] {
  return group.columns.flatMap((column) => column.blocks.flatMap((block) => block.links));
}

export function navPathFromUrl(url: string): string {
  return url.split('?')[0].split('#')[0];
}

export function navHrefMatchesPath(href: string, path: string): boolean {
  if (href === '/') {
    return path === '/' || path === '';
  }
  return path === href || path.startsWith(`${href}/`);
}

function groupMatchHrefs(group: NavGroup): string[] {
  const hrefs = group.href ? [group.href] : flattenNavLinks(group).map((link) => link.href);
  return [...hrefs, ...(group.matchHrefs ?? [])];
}

export function navGroupIsActive(group: NavGroup, url: string): boolean {
  const path = navPathFromUrl(url);
  return groupMatchHrefs(group).some((href) => navHrefMatchesPath(href, path));
}

export function activeNavGroupLabel(groups: readonly NavGroup[], url: string): string | null {
  const path = navPathFromUrl(url);
  let bestLabel: string | null = null;
  let bestLength = -1;
  for (const group of groups) {
    for (const href of groupMatchHrefs(group)) {
      if (!navHrefMatchesPath(href, path)) continue;
      if (href.length > bestLength) {
        bestLength = href.length;
        bestLabel = group.label;
      }
    }
  }
  return bestLabel;
}
