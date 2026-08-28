import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { MockUserProfileRepository } from '../../adapters/mock/mock-user.repository';
import { InvalidUserProfileError } from '../../domain/errors/domain-error';
import { UpdateUserContact } from './update-user-contact';

describe('UpdateUserContact', () => {
  it('guarda un correo y teléfono válidos', async () => {
    const useCase = new UpdateUserContact(new MockUserProfileRepository());
    const result = await firstValueFrom(
      useCase.execute({ email: 'nueva@helvia.demo', phonePrefix: '+34', phone: '699111222' }),
    );
    expect(result.email).toBe('nueva@helvia.demo');
    expect(result.phone).toBe('699111222');
  });

  it('rechaza un teléfono corto antes de persistir', async () => {
    const useCase = new UpdateUserContact(new MockUserProfileRepository());
    await expect(
      firstValueFrom(useCase.execute({ email: 'ok@helvia.demo', phonePrefix: '+34', phone: '123' })),
    ).rejects.toBeInstanceOf(InvalidUserProfileError);
  });
});
