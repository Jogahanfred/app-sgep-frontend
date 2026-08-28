import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Button } from '../button/button';
import { Container } from '../container/container';

@Component({
  selector: 'app-hero-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, Button],
  templateUrl: './hero-banner.html',
  styleUrl: './hero-banner.scss',
})
export class HeroBanner {
  readonly eyebrow = input<string | undefined>(undefined);
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly primaryLabel = input.required<string>();
  readonly primaryHref = input.required<string>();
  readonly secondaryLabel = input<string | undefined>(undefined);
  readonly secondaryHref = input<string | undefined>(undefined);
  readonly compact = input(false);
  readonly image = input<string | undefined>(undefined);
  readonly imageAlt = input(' ');
  readonly align = input<'start' | 'end'>('start');
}
