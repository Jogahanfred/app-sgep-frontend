import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { MockUserProfileRepository } from '../../adapters/mock/mock-user.repository';
import { DEMO_PASSWORD } from '../../domain/entities';
import { InvalidUserProfileError } from '../../domain/errors/domain-error';
import { ChangeUserPassword } from './change-user-password';

describe('ChangeUserPassword', () => {
  it('cambia la contraseña cuando la actual es correcta', async () => {
    const repo = new MockUserProfileRepository();
    const useCase = new ChangeUserPassword(repo);
    const result = await firstValueFrom(
      useCase.execute({
        currentPassword: DEMO_PASSWORD,
        newPassword: 'Otra.clave9',
        confirmPassword: 'Otra.clave9',
      }),
    );
    expect(result.lastPasswordChange).toBe(new Date().toISOString().slice(0, 10));
  });

  it('rechaza la contraseña actual incorrecta', async () => {
    const useCase = new ChangeUserPassword(new MockUserProfileRepository());
    await expect(
      firstValueFrom(
        useCase.execute({
          currentPassword: 'incorrecta',
          newPassword: 'Otra.clave9',
          confirmPassword: 'Otra.clave9',
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidUserProfileError);
  });
});
