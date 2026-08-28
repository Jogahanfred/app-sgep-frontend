import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './layout/footer/footer';
import { Header } from './layout/header/header';
import { BackToTop } from './shared/components/back-to-top/back-to-top';
import { SkipLink } from './shared/components/skip-link/skip-link';
import { UiToast } from './shared/components/ui-toast/ui-toast';
import { SeoService } from './shared/seo/seo.service';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Header, Footer, SkipLink, BackToTop, UiToast],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  constructor() {
    inject(SeoService);
  }
}
