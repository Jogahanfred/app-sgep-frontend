import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { isMissionExecutionBoardUrl } from '@layout/navigation/data/nav-routes.constants';
import { Container } from '@shared/components/container/container';
import { filter, map } from 'rxjs';
import { catalogPageHeader, isCatalogRecordUrl } from '../../../constants/catalog-section.constants';

@Component({
  selector: 'app-catalog-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, RouterOutlet],
  templateUrl: './catalog.layout.html',
  styleUrl: './catalog.layout.scss',
})
export class CatalogLayout {
  private readonly router = inject(Router);

  readonly boardScreen = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => isMissionExecutionBoardUrl(event.urlAfterRedirects)),
    ),
    { initialValue: isMissionExecutionBoardUrl(this.router.url) },
  );

  readonly pageHeader = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => (isCatalogRecordUrl(event.urlAfterRedirects) ? null : catalogPageHeader(event.urlAfterRedirects))),
    ),
    { initialValue: isCatalogRecordUrl(this.router.url) ? null : catalogPageHeader(this.router.url) },
  );
}
