import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import type { NavGroup } from '@shared/models/nav.model';
import { Button } from '@shared/components/button/button';
import { Icon } from '@shared/components/icon/icon';
import { UiAvatar } from '@shared/components/ui-avatar/ui-avatar';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { Modal } from '@shared/components/modal/modal';
import { MAIN_NAV } from '../navigation/data/nav.data';
import { MegaMenu } from '../navigation/mega-menu/mega-menu';
import { NavigationMenu } from '../navigation/navigation-menu/navigation-menu';
import { MobileMenu } from '../mobile-menu/mobile-menu';
import { ClientSession } from '../client-session.service';
import { ScrollChrome } from '../scroll-chrome.service';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Button, NavigationMenu, MegaMenu, MobileMenu, Modal, UiInput, ReactiveFormsModule, Icon, UiAvatar],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly destroyRef = inject(DestroyRef);
  private readonly chrome = inject(ScrollChrome);
  private readonly router = inject(Router);
  readonly session = inject(ClientSession);
  readonly groups = MAIN_NAV;
  readonly scrolled = signal(false);
  readonly hidden = signal(false);
  readonly mobileOpen = signal(false);
  readonly loginOpen = signal(false);
  readonly loginMessage = signal<string | null>(null);
  readonly megaLabel = signal<string | null>(null);
  readonly userMenuOpen = signal(false);
  private pendingNext = '/perfil';

  readonly loginForm = new FormGroup({
    user: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(4)] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
  });

  constructor() {
    let lastY = window.scrollY;
    const onScroll = () => {
      if (document.documentElement.classList.contains('is-scroll-locked')) return;
      const y = window.scrollY;
      const atTop = y < 12;
      this.scrolled.set(y > 8);
      this.chrome.atTop.set(atTop);

      if (this.megaLabel() || this.mobileOpen()) {
        this.setHidden(false);
        lastY = y;
        return;
      }

      if (atTop) {
        this.setHidden(false);
      } else if (y > lastY + 4) {
        this.setHidden(true);
        this.closeMega();
      } else if (y < lastY - 4) {
        this.setHidden(false);
      }

      lastY = y;
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.closeMega();
        this.closeUserMenu();
      }
    };
    const onDocClick = (event: MouseEvent) => {
      if (!this.userMenuOpen()) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('.usermenu')) return;
      this.closeUserMenu();
    };
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.openLoginIfNeeded());
    this.openLoginIfNeeded();

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKey);
    document.addEventListener('click', onDocClick);
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onDocClick);
      document.body.style.removeProperty('overflow');
    });
  }

  private setHidden(hidden: boolean): void {
    this.hidden.set(hidden);
    this.chrome.headerHidden.set(hidden);
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

  toggleUserMenu(): void {
    this.closeMega();
    this.userMenuOpen.update((open) => !open);
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  goProfile(): void {
    this.closeUserMenu();
    this.closeMega();
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
    this.session.signIn('Elena');
    this.loginForm.reset();
    this.closeLogin();
    const next = this.pendingNext || '/perfil';
    this.pendingNext = '/perfil';
    void this.router.navigateByUrl(next);
  }

  private openLoginIfNeeded(): void {
    if (this.session.loggedIn()) return;
    const tree = this.router.parseUrl(this.router.url);
    const next = tree.queryParams['next'];
    if (!next || this.loginOpen()) return;
    this.pendingNext = next;
    this.openLogin();
  }

  signOut(): void {
    this.session.signOut();
    this.closeMega();
    this.closeUserMenu();
    void this.router.navigate(['/']);
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
