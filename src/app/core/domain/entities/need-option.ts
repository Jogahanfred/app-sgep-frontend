export type NeedId = 'finance' | 'protect' | 'save' | 'home' | 'daily' | 'insure';

export interface NeedOption {
  id: NeedId;
  label: string;
  description: string;
  icon: string;
}
