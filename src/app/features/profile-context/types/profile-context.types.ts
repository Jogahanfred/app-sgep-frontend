export type ProfileEmblemSize = 'sm' | 'md' | 'lg';

export type ProfileContextStep = 'units' | 'squadrons';

export interface ProfileEmblemCardModel {
  id: string;
  code: string;
  name: string;
  caption: string;
  imageUrl?: string;
}
