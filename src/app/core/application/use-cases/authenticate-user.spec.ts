import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { MockAuthRepository } from '../../adapters/mock/mock-auth.repository';
import { InvalidCredentialsError } from '../../domain/errors/domain-error';
import { AuthenticateUser } from './authenticate-user';

describe('AuthenticateUser', () => {
  it('autentica por identificador y asigna el rol operacional', async () => {
    const identity = await firstValueFrom(new AuthenticateUser(new MockAuthRepository()).execute('elena', 'Helvia.2026'));
    expect(identity.userId).toBe('usr-elena-martin');
    expect(identity.roleCode).toBe('ADSYS');
  });

  it('rechaza credenciales inválidas', async () => {
    await expect(
      firstValueFrom(new AuthenticateUser(new MockAuthRepository()).execute('elena', 'clave-falsa')),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });
});
