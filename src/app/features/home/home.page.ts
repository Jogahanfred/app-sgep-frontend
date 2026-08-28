import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GetHomeContent, type HomeContent } from '@core/application';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { Container } from '@shared/components/container/container';
import { HeroBanner } from '@shared/components/hero-banner/hero-banner';
import { Section } from '@shared/components/section/section';
import { UiLoading } from '@shared/components/ui';
import { LoanCalculator } from '../loans/loan-calculator';
import { FaqSection } from './sections/faq.section';
import { HelpSection } from './sections/help.section';
import { NeedSelectorSection } from './sections/need-selector.section';
import { ProductSection } from './sections/product.section';
import { PromotionSection } from './sections/promotion.section';
import { ThemeSection } from './sections/theme.section';

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HeroBanner,
    NeedSelectorSection,
    ThemeSection,
    ProductSection,
    PromotionSection,
    HelpSection,
    FaqSection,
    LoanCalculator,
    Section,
    Container,
    Button,
    Alert,
    UiLoading,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage {
  private readonly getHome = inject(GetHomeContent);
  private readonly destroyRef = inject(DestroyRef);

  readonly content = signal<HomeContent | null>(null);
  readonly status = signal<'loading' | 'ready' | 'error'>('loading');

  constructor() {
    this.getHome
      .execute()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.content.set(data);
          this.status.set('ready');
        },
        error: () => this.status.set('error'),
      });
  }
}
