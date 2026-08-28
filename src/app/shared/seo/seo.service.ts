import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

export interface SeoData {
  title: string;
  description: string;
}

const DEFAULT_SEO: SeoData = {
  title: 'Helvia Banca | Banca para particulares',
  description:
    'Cuentas, tarjetas, préstamos, hipotecas e inversión con una banca clara. Helvia es una entidad ficticia creada con fines demostrativos.',
};

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);

  constructor() {
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe(() => {
      const data = this.readDeepestSeo();
      this.apply(data);
    });
  }

  apply(data: SeoData): void {
    const title = data.title;
    const description = data.description;
    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
  }

  private readDeepestSeo(): SeoData {
    let route = this.router.routerState.root;
    let seo = DEFAULT_SEO;

    while (route.firstChild) {
      route = route.firstChild;
      const data = route.snapshot.data['seo'] as SeoData | undefined;
      if (data) {
        seo = data;
      }
    }

    return seo;
  }
}
