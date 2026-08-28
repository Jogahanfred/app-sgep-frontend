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
}

export function flattenNavLinks(group: NavGroup): NavLink[] {
  return group.columns.flatMap((column) => column.blocks.flatMap((block) => block.links));
}
