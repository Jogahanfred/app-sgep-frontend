import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { NavGroup } from '@shared/models/nav.model';
import { Button } from '@shared/components/button/button';
import { Icon } from '@shared/components/icon/icon';
import { FormInput } from '@shared/components/input/input';
import { Modal } from '@shared/components/modal/modal';
import { MAIN_NAV } from '../navigation/nav.data';
import { MegaMenu } from '../navigation/mega-menu';
import { NavigationMenu } from '../navigation/navigation-menu';
import { MobileMenu } from '../mobile-menu/mobile-menu';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Button, NavigationMenu, MegaMenu, MobileMenu, Modal, FormInput, ReactiveFormsModule, Icon],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly destroyRef = inject(DestroyRef);
  readonly groups = MAIN_NAV;
  readonly scrolled = signal(false);
  readonly mobileOpen = signal(false);
  readonly loginOpen = signal(false);
  readonly loginMessage = signal<string | null>(null);
  readonly megaLabel = signal<string | null>(null);

  readonly loginForm = new FormGroup({
    user: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(4)] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
  });

  constructor() {
    const onScroll = () => this.scrolled.set(window.scrollY > 8);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') this.closeMega();
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKey);
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKey);
      document.body.style.removeProperty('overflow');
    });
  }

  openGroup(): NavGroup | null {
    const label = this.megaLabel();
    return this.groups.find((group) => group.label === label) ?? null;
  }

  setMega(label: string | null): void {
    this.megaLabel.set(label);
    document.body.style.overflow = label ? 'hidden' : '';
  }

  closeMega(): void {
    this.setMega(null);
  }

  toggleMobile(): void {
    this.closeMega();
    this.mobileOpen.update((open) => !open);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  openLogin(): void {
    this.closeMega();
    this.loginMessage.set(null);
    this.loginOpen.set(true);
  }

  closeLogin(): void {
    this.loginOpen.set(false);
  }

  submitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.loginMessage.set('Esto es una demostración. Helvia no procesa accesos reales.');
    this.loginForm.reset();
  }

  userError(): string | undefined {
    const control = this.loginForm.controls.user;
    if (!control.touched || !control.invalid) return undefined;
    return 'Introduce tu identificador (mínimo 4 caracteres).';
  }

  passwordError(): string | undefined {
    const control = this.loginForm.controls.password;
    if (!control.touched || !control.invalid) return undefined;
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
}
