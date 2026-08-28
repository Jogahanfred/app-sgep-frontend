import { InvalidUserProfileError } from '../errors/domain-error';
import type {
  AddressInput,
  ContactInput,
  PasswordChangeInput,
  PersonalDataInput,
} from '../entities/user-profile';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[0-9]{9}$/;
const POSTAL = /^[0-9]{5}$/;

function required(value: string, message: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new InvalidUserProfileError(message);
  }
  return trimmed;
}

export function assertPersonalData(input: PersonalDataInput): PersonalDataInput {
  return {
    firstName: required(input.firstName, 'El nombre es obligatorio.'),
    lastName: required(input.lastName, 'El primer apellido es obligatorio.'),
    secondLastName: input.secondLastName.trim(),
    documentType: required(input.documentType, 'Selecciona el tipo de documento.'),
    documentNumber: required(input.documentNumber, 'Indica el número de documento.'),
    birthDate: required(input.birthDate, 'Indica la fecha de nacimiento.'),
    nationality: required(input.nationality, 'Indica la nacionalidad.'),
    occupation: input.occupation.trim(),
  };
}

export function assertContact(input: ContactInput): ContactInput {
  const email = required(input.email, 'El correo es obligatorio.').toLowerCase();
  if (!EMAIL.test(email)) {
    throw new InvalidUserProfileError('Necesitamos un correo válido.');
  }
  const phone = required(input.phone, 'El teléfono es obligatorio.');
  if (!PHONE.test(phone)) {
    throw new InvalidUserProfileError('Introduce un teléfono de 9 dígitos.');
  }
  return {
    email,
    phonePrefix: required(input.phonePrefix, 'Indica el prefijo.'),
    phone,
  };
}

export function assertAddress(input: AddressInput): AddressInput {
  const postalCode = required(input.postalCode, 'El código postal es obligatorio.');
  if (!POSTAL.test(postalCode)) {
    throw new InvalidUserProfileError('El código postal debe tener 5 dígitos.');
  }
  return {
    address: required(input.address, 'La dirección es obligatoria.'),
    city: required(input.city, 'La localidad es obligatoria.'),
    postalCode,
    province: required(input.province, 'La provincia es obligatoria.'),
  };
}

export function assertPasswordChange(input: PasswordChangeInput): string {
  if (!input.currentPassword) {
    throw new InvalidUserProfileError('Escribe tu contraseña actual.');
  }
  if (input.newPassword.length < 8) {
    throw new InvalidUserProfileError('La nueva contraseña debe tener al menos 8 caracteres.');
  }
  if (!/[A-Z]/.test(input.newPassword) || !/[0-9]/.test(input.newPassword) || !/[^A-Za-z0-9]/.test(input.newPassword)) {
    throw new InvalidUserProfileError('Usa mayúscula, número y un símbolo.');
  }
  if (input.newPassword !== input.confirmPassword) {
    throw new InvalidUserProfileError('Las contraseñas nuevas no coinciden.');
  }
  if (input.newPassword === input.currentPassword) {
    throw new InvalidUserProfileError('La nueva contraseña debe ser distinta de la actual.');
  }
  return input.newPassword;
}

export function assertPhotoDataUrl(photoUrl: string | null): string | null {
  if (photoUrl === null) return null;
  if (!photoUrl.startsWith('data:image/')) {
    throw new InvalidUserProfileError('La foto debe ser una imagen JPEG, PNG o WebP.');
  }
  if (photoUrl.length > 2_800_000) {
    throw new InvalidUserProfileError('La foto no puede superar 2 MB.');
  }
  return photoUrl;
}

export function profileInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
