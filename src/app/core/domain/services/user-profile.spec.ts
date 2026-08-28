import { describe, expect, it } from 'vitest';
import { InvalidUserProfileError } from '../errors/domain-error';
import { assertContact, assertPasswordChange, profileInitials } from './user-profile';

describe('user-profile domain', () => {
  it('rechaza un correo inválido', () => {
    expect(() =>
      assertContact({ email: 'elena', phonePrefix: '+34', phone: '612345678' }),
    ).toThrow(InvalidUserProfileError);
  });

  it('exige mayúscula, número y símbolo en la contraseña', () => {
    expect(() =>
      assertPasswordChange({
        currentPassword: 'Helvia.2026',
        newPassword: 'helvia2026',
        confirmPassword: 'helvia2026',
      }),
    ).toThrow(/mayúscula/);
  });

  it('acepta un cambio de contraseña válido', () => {
    expect(
      assertPasswordChange({
        currentPassword: 'Helvia.2026',
        newPassword: 'Nueva.clave1',
        confirmPassword: 'Nueva.clave1',
      }),
    ).toBe('Nueva.clave1');
  });

  it('calcula las iniciales', () => {
    expect(profileInitials('Elena', 'Martín')).toBe('EM');
  });
});
