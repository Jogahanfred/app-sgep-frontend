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
      map((event) => !isRecordUrl(event.urlAfterRedirects)),
    ),
    { initialValue: !isRecordUrl(this.router.url) },
  );
}

function isRecordUrl(url: string): boolean {
  return /\/catalogo\/(usuarios|roles|especialidades|unidades|escuadrones|comisiones-temporales)\/[^/?#]+/.test(url);
}
