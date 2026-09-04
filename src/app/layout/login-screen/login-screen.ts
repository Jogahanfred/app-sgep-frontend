import { ChangeDetectionStrategy, Component, DestroyRef, effect, ElementRef, inject, input, output, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Badge } from '@shared/components/badge/badge';
import { Button } from '@shared/components/button/button';
import { Icon } from '@shared/components/icon/icon';
import { UiChip } from '@shared/components/ui-chip/ui-chip';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { DocumentScrollLock } from '@shared/utils/document-scroll-lock';
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
  imports: [ReactiveFormsModule, Badge, Button, Icon, UiChip, UiInput],
  templateUrl: './login-screen.html',
  styleUrl: './login-screen.scss',
})
export class LoginScreen {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly session = inject(ClientSession);
  private readonly router = inject(Router);
  private readonly scrollLock = inject(DocumentScrollLock);
  private locked = false;
  readonly open = input(false);
  readonly nextUrl = input(LOGIN_DEFAULT_NEXT_URL);
  readonly closed = output<void>();
  readonly signedIn = output<void>();
  readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  readonly copy = LOGIN_COPY;
  readonly metrics = LOGIN_SHOWCASE_METRICS;
  readonly showcaseImage = LOGIN_SHOWCASE_IMAGE;
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

  constructor() {
    inject(DestroyRef).onDestroy(() => this.releaseScroll());
    effect(() => {
      const el = this.dialog()?.nativeElement;
      if (!el) return;
      if (this.open()) {
        this.holdScroll();
        if (!el.open) {
          el.showModal();
        }
        const field = this.host.nativeElement.querySelector('#login-user');
        if (field instanceof HTMLElement) {
          field.focus();
        }
      } else {
        if (el.open) {
          el.close();
        }
        this.releaseScroll();
      }
    });
  }

  close(): void {
    this.closed.emit();
  }

  onCancel(event: Event): void {
    event.preventDefault();
    this.close();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.session.signIn('Elena');
    this.form.reset();
    const next = this.nextUrl() || LOGIN_DEFAULT_NEXT_URL;
    this.signedIn.emit();
    this.close();
    void this.router.navigateByUrl(next);
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

  private holdScroll(): void {
    if (this.locked) return;
    this.scrollLock.lock();
    this.locked = true;
  }

  private releaseScroll(): void {
    if (!this.locked) return;
    this.scrollLock.unlock();
    this.locked = false;
  }
}
