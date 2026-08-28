export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  secondLastName: string;
  documentType: string;
  documentNumber: string;
  birthDate: string;
  nationality: string;
  email: string;
  phonePrefix: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  province: string;
  occupation: string;
  photoUrl: string | null;
  language: string;
  marketingEmail: boolean;
  marketingSms: boolean;
  securityAlerts: boolean;
  twoFactorEnabled: boolean;
  lastPasswordChange: string;
}

export interface PersonalDataInput {
  firstName: string;
  lastName: string;
  secondLastName: string;
  documentType: string;
  documentNumber: string;
  birthDate: string;
  nationality: string;
  occupation: string;
}

export interface ContactInput {
  email: string;
  phonePrefix: string;
  phone: string;
}

export interface AddressInput {
  address: string;
  city: string;
  postalCode: string;
  province: string;
}

export interface PreferenceInput {
  language: string;
  marketingEmail: boolean;
  marketingSms: boolean;
  securityAlerts: boolean;
  twoFactorEnabled: boolean;
}

export interface PasswordChangeInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const DEMO_PASSWORD = 'Helvia.2026';
