import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Footer } from '@layout/footer/footer';
import { Header } from '@layout/header/header';
import { isBareChromeUrl } from '@layout/auth-routes.constants';
import { isMissionExecutionBoardUrl } from '@layout/navigation/data/nav-routes.constants';
import { BackToTop } from '@shared/components/back-to-top/back-to-top';
import { SkipLink } from '@shared/components/skip-link/skip-link';
import { UiToast } from '@shared/components/ui-toast/ui-toast';
import { SeoService } from '@shared/seo/seo.service';
import { filter, map, startWith } from 'rxjs';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Header, Footer, SkipLink, BackToTop, UiToast],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );
  readonly bareChrome = computed(() => isBareChromeUrl(this.url()));
  readonly boardScreen = computed(() => isMissionExecutionBoardUrl(this.url()));

  constructor() {
    inject(SeoService);
  }
}
