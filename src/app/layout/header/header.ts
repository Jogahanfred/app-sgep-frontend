import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { activeNavGroupLabel, type NavGroup } from '@shared/models/nav.model';
import { Icon } from '@shared/components/icon/icon';
import { UiAvatar } from '@shared/components/ui-avatar/ui-avatar';
import { LOGIN_ROUTE } from '../auth-routes.constants';
import { MAIN_NAV } from '../navigation/data/nav.data';
import { MegaMenu } from '../navigation/mega-menu/mega-menu';
import { NavigationMenu } from '../navigation/navigation-menu/navigation-menu';
import { MobileMenu } from '../mobile-menu/mobile-menu';
import { ClientSession } from '../client-session.service';
import { ContextSquadronModal } from '../context-squadron-modal';
import { ScrollChrome } from '../scroll-chrome.service';
import { getProfileRequirements } from '@core/domain/services/profile-context-policy';
import { PROFILE_CONTEXT_COPY } from '@features/profile-context/constants/profile-context.copy.constants';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NavigationMenu, MegaMenu, MobileMenu, Icon, UiAvatar, ContextSquadronModal],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly destroyRef = inject(DestroyRef);
  private readonly chrome = inject(ScrollChrome);
  private readonly router = inject(Router);
  readonly session = inject(ClientSession);
  readonly groups = MAIN_NAV;
  readonly currentUrl = signal(this.router.url);
  readonly activeNavLabel = computed(() => activeNavGroupLabel(this.groups, this.currentUrl()));
  readonly scrolled = signal(false);
  readonly hidden = signal(false);
  readonly mobileOpen = signal(false);
  readonly megaLabel = signal<string | null>(null);
  readonly userMenuOpen = signal(false);
  readonly squadronModalOpen = signal(false);
  readonly loginRoute = LOGIN_ROUTE;
  readonly squadronPickerLabel = PROFILE_CONTEXT_COPY.chooseSquadron;
  readonly contextEmblems = computed(() => {
    if (!this.session.contextConfirmed()) return [];
    const emblems: { id: string; name: string; imageUrl: string }[] = [];
    const unitName = this.session.unitName();
    const unitImageUrl = this.session.unitImageUrl();
    if (unitName && unitImageUrl) {
      emblems.push({ id: 'unit', name: unitName, imageUrl: unitImageUrl });
    }
    const squadronName = this.session.squadronName();
    const squadronImageUrl = this.session.squadronImageUrl();
    if (squadronName && squadronImageUrl) {
      emblems.push({ id: 'squadron', name: squadronName, imageUrl: squadronImageUrl });
    }
    return emblems;
  });
  readonly showSquadronPicker = computed(() => {
    if (!this.session.contextConfirmed()) return false;
    const role = this.session.roleCode();
    if (!role || !getProfileRequirements(role).allowSquadronChange) return false;
    return !!this.session.unitId() && !this.session.squadronId();
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
        this.closeSquadronModal();
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
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects);
        this.closeUserMenu();
      });

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

  openSquadronModal(): void {
    this.closeMega();
    this.closeUserMenu();
    this.squadronModalOpen.set(true);
  }

  closeSquadronModal(): void {
    this.squadronModalOpen.set(false);
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
    this.closeMobile();
    void this.router.navigate([LOGIN_ROUTE]);
  }

  signOut(): void {
    this.session.signOut();
    this.closeMega();
    this.closeUserMenu();
    this.closeSquadronModal();
    void this.router.navigate([LOGIN_ROUTE]);
  }
}
