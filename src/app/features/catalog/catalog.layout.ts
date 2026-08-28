import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { Container } from '@shared/components/container/container';

@Component({
  selector: 'app-catalog-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './catalog.layout.html',
  styleUrl: './catalog.layout.scss',
})
export class CatalogLayout {
  private readonly router = inject(Router);

  readonly showDomainNav = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => !isCreateUrl(event.urlAfterRedirects)),
    ),
    { initialValue: !isCreateUrl(this.router.url) },
  );
}

function isCreateUrl(url: string): boolean {
  return /\/nuevo(?:[/?#]|$)/.test(url);
}
