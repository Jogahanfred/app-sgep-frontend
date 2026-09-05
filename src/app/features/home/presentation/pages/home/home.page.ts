import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { GetDashboardOverview, type RoleDashboard } from '@core/application';
import { Alert } from '@shared/components/alert/alert';
import { Container } from '@shared/components/container/container';
import { Section } from '@shared/components/section/section';
import { UiLoading } from '@shared/components/ui';
import { ClientSession } from '../../../../../layout/client-session.service';
import { DASHBOARD_COPY } from '../../../constants/dashboard.copy.constants';

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Container, RouterLink, Section, UiLoading],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage {
  private readonly getOverview = inject(GetDashboardOverview);
  private readonly destroyRef = inject(DestroyRef);
  readonly session = inject(ClientSession);

  readonly copy = DASHBOARD_COPY;
  readonly dashboard = signal<RoleDashboard | null>(null);
  readonly status = signal<'loading' | 'ready' | 'error' | 'missing'>('loading');

  constructor() {
    const context = this.session.operationalContext();
    if (!context) {
      this.status.set('missing');
      return;
    }
    this.getOverview
      .execute(context)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.dashboard.set(data);
          this.status.set('ready');
        },
        error: () => this.status.set('error'),
      });
  }
}
