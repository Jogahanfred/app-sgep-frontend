export const UI_AVATAR_SIZES = ['sm', 'md', 'lg'] as const;
export type UiAvatarSize = (typeof UI_AVATAR_SIZES)[number];

export const UI_AVATAR_RADII = ['circle', 'sm', 'md', 'lg'] as const;
export type UiAvatarRadius = (typeof UI_AVATAR_RADII)[number];
