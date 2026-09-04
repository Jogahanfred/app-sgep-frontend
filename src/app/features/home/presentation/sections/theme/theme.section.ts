import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MediaFeature } from '@shared/components/media-feature/media-feature';
import { Section } from '@shared/components/section/section';
import { Tabs, type TabItem } from '@shared/components/tabs/tabs';

interface ThemeBlock {
  id: string;
  heading: string;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
  imageAlt: string;
}

const TABS: TabItem[] = [
  { id: 'casa', label: 'Compra tu casa' },
  { id: 'ahorro', label: 'Nuevas formas de ahorrar' },
  { id: 'dinero', label: 'Administra tu dinero' },
];

const BLOCKS: Record<string, ThemeBlock> = {
  casa: {
    id: 'casa',
    heading: 'Simula tu hipoteca',
    eyebrow: 'Simulador',
    title: 'Calcula la cuota mensual de tu hipoteca',
    description: 'Ya sea tu vivienda principal o segunda residencia, nueva o usada.',
    ctaLabel: 'Calcular tu cuota',
    ctaHref: '/hipotecas',
    image: '/images/home-interior.jpg',
    imageAlt: 'Interior luminoso de una vivienda, ilustración de uso libre',
  },
  ahorro: {
    id: 'ahorro',
    heading: 'Haz crecer tu ahorro',
    eyebrow: 'Ahorro',
    title: 'Separa tu colchón y dale un horizonte',
    description: 'Huchas, remuneración por tramos y traspasos a tu cuenta en el momento.',
    ctaLabel: 'Ver ahorro',
    ctaHref: '/inversion',
    image: '/images/home-interior.jpg',
    imageAlt: 'Espacio doméstico asociado al ahorro',
  },
  dinero: {
    id: 'dinero',
    heading: 'Tu dinero, a la vista',
    eyebrow: 'Día a día',
    title: 'Cuentas y tarjetas en una sola app',
    description: 'Movimientos, Bizum, límites y alertas. Sin letra pequeña en el mantenimiento.',
    ctaLabel: 'Ver cuentas',
    ctaHref: '/cuentas',
    image: '/images/hero-lifestyle.jpg',
    imageAlt: 'Personas al aire libre, ilustración de uso libre',
  },
};

@Component({
  selector: 'app-theme-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Section, Tabs, MediaFeature],
  template: `
    <app-section align="center" sectionId="temas">
      <app-tabs [tabs]="tabs" [activeId]="active()" (tabChange)="active.set($event)" />
      <h2 class="theme__heading">{{ current().heading }}</h2>
      <app-media-feature
        [image]="current().image"
        [imageAlt]="current().imageAlt"
        [eyebrow]="current().eyebrow"
        [title]="current().title"
        [description]="current().description"
        [ctaLabel]="current().ctaLabel"
        [ctaHref]="current().ctaHref"
      />
    </app-section>
  `,
  styles: `
    app-tabs {
      display: block;
      margin-bottom: var(--spacing-xl);
    }

    .theme__heading {
      text-align: center;
      font-size: var(--fs-3xl);
      font-weight: 800;
      margin-bottom: var(--spacing-xl);
    }
  `,
})
export class ThemeSection {
  readonly tabs = TABS;
  readonly active = signal('casa');

  current(): ThemeBlock {
    return BLOCKS[this.active()] ?? BLOCKS['casa'];
  }
}
