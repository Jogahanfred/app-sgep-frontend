export type NeedId = 'finance' | 'protect' | 'save' | 'home' | 'daily';

export interface NeedOption {
  id: NeedId;
  label: string;
  description: string;
  icon: string;
}
