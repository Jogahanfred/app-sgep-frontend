import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticateUser } from '@core/application';
import { DomainError } from '@core/domain/errors/domain-error';
import { Alert } from '@shared/components/alert/alert';
import { Badge } from '@shared/components/badge/badge';
import { Button } from '@shared/components/button/button';
import { Icon } from '@shared/components/icon/icon';
import { UiChip } from '@shared/components/ui-chip/ui-chip';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { firstValueFrom } from 'rxjs';
import { PROFILE_CONTEXT_ROUTE, safeInternalUrl } from '../auth-routes.constants';
import { ClientSession } from '../client-session.service';
import {
  LOGIN_DEFAULT_NEXT_URL,
  LOGIN_PASSWORD_MIN_LENGTH,
  LOGIN_SHOWCASE_IMAGE,
  LOGIN_SHOWCASE_METRICS,
  LOGIN_USER_MIN_LENGTH,
} from './login-screen.constants';
import { LOGIN_COPY } from './login-screen.copy.constants';

@Component({
  selector: 'app-login-screen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Alert, Badge, Button, Icon, UiChip, UiInput],
  templateUrl: './login-screen.html',
  styleUrl: './login-screen.scss',
})
export class LoginScreen {
  private readonly session = inject(ClientSession);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authenticateUser = inject(AuthenticateUser);
  readonly copy = LOGIN_COPY;
  readonly metrics = LOGIN_SHOWCASE_METRICS;
  readonly showcaseImage = LOGIN_SHOWCASE_IMAGE;
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = new FormGroup({
    user: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(LOGIN_USER_MIN_LENGTH)],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(LOGIN_PASSWORD_MIN_LENGTH)],
    }),
  });

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set(null);
    this.submitting.set(true);
    try {
      const { user, password } = this.form.getRawValue();
      const identity = await firstValueFrom(this.authenticateUser.execute(user, password));
      this.session.signInIdentity(identity);
      this.form.reset();
      const next = safeInternalUrl(this.route.snapshot.queryParamMap.get('next'), LOGIN_DEFAULT_NEXT_URL);
      await this.router.navigate([PROFILE_CONTEXT_ROUTE], { queryParams: { next } });
    } catch (err: unknown) {
      this.error.set(err instanceof DomainError ? err.message : this.copy.credentialsError);
    } finally {
      this.submitting.set(false);
    }
  }

  userError(): string | undefined {
    const control = this.form.controls.user;
    if (!control.touched || !control.invalid) return undefined;
    return LOGIN_COPY.userError;
  }

  passwordError(): string | undefined {
    const control = this.form.controls.password;
    if (!control.touched || !control.invalid) return undefined;
    return LOGIN_COPY.passwordError;
  }
}
