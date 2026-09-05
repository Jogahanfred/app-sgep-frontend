import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmProfileContext, GetProfileContext, type ProfileContextSnapshot } from '@core/application';
import { ALL_SQUADRONS_CONTEXT_VALUE } from '@core/domain/entities/operational-context';
import { DomainError } from '@core/domain/errors/domain-error';
import {
  squadronsForUnit,
  validateProfileSelection,
} from '@core/domain/services/profile-context-policy';
import { LOGIN_DEFAULT_NEXT_URL } from '@layout/login-screen/login-screen.constants';
import { LOGIN_ROUTE, safeInternalUrl } from '@layout/auth-routes.constants';
import { ClientSession, type OperationalContextPresentation } from '@layout/client-session.service';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { Container } from '@shared/components/container/container';
import { UiAvatar } from '@shared/components/ui-avatar/ui-avatar';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { firstValueFrom } from 'rxjs';
import { PROFILE_CONTEXT_COPY } from '../../../constants/profile-context.copy.constants';
import type { ProfileContextStep, ProfileEmblemCardModel } from '../../../types/profile-context.types';
import { ProfileEmblemCard } from '../../components/profile-emblem-card/profile-emblem-card';

@Component({
  selector: 'app-profile-context-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Button, Container, UiAvatar, UiLoading, ProfileEmblemCard],
  templateUrl: './profile-context.page.html',
  styleUrl: './profile-context.page.scss',
})
export class ProfileContextPage {
  private readonly session = inject(ClientSession);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly getProfileContext = inject(GetProfileContext);
  private readonly confirmProfileContext = inject(ConfirmProfileContext);

  readonly copy = PROFILE_CONTEXT_COPY;
  readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  readonly error = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly snapshot = signal<ProfileContextSnapshot | null>(null);
  readonly step = signal<ProfileContextStep>('units');
  readonly unitId = signal<string | null>(null);
  readonly squadronId = signal<string | null>(null);

  readonly unitCards = computed<ProfileEmblemCardModel[]>(() => {
    const snap = this.snapshot();
    if (!snap) return [];
    const assignedId = snap.identity.assignedUnitId;
    const branded = snap.units.filter((unit) => !!unit.imageUrl);
    const source = snap.requirements.allowUnitChange
      ? branded.length
        ? branded
        : snap.units
      : snap.units.filter((unit) => unit.id === assignedId);
    return source.map((unit) => ({
      id: unit.id,
      code: unit.code,
      name: unit.name,
      caption: unit.abbreviation,
      imageUrl: unit.imageUrl,
    }));
  });

  readonly squadronCards = computed<ProfileEmblemCardModel[]>(() => {
    const snap = this.snapshot();
    if (!snap) return [];
    const items = squadronsForUnit(snap.squadrons, this.unitId()).map((squadron) => ({
      id: squadron.id,
      code: squadron.code,
      name: squadron.name,
      caption: squadron.description,
      imageUrl: squadron.imageUrl,
    }));
    if (snap.requirements.allowAllSquadrons) {
      return [
        {
          id: ALL_SQUADRONS_CONTEXT_VALUE,
          code: snap.roleCode,
          name: this.copy.allSquadrons,
          caption: this.copy.allSquadronsCaption,
        },
        ...items,
      ];
    }
    return items;
  });

  readonly squadronsEmpty = computed(() => {
    const snap = this.snapshot();
    if (!snap || !this.unitId() || snap.requirements.squadronMode === 'hidden') return false;
    return squadronsForUnit(snap.squadrons, this.unitId()).length === 0;
  });

  readonly selectedUnitLabel = computed(() => {
    const id = this.unitId();
    return this.snapshot()?.units.find((unit) => unit.id === id)?.name ?? this.copy.none;
  });

  readonly canContinue = computed(() => {
    const snap = this.snapshot();
    if (!snap) return false;
    if (snap.requirements.squadronMode !== 'hidden' && this.step() === 'units') return false;
    if (this.step() === 'squadrons' && !this.squadronId()) return false;
    try {
      validateProfileSelection(
        snap.identity,
        { unitId: this.unitId(), squadronId: this.squadronId() },
        snap.units,
        snap.squadrons,
      );
      return true;
    } catch {
      return false;
    }
  });

  readonly heading = computed(() => {
    const requirements = this.snapshot()?.requirements;
    if (!requirements) return this.copy.title;
    if (requirements.contextKind === 'audit') return this.copy.auditTitle;
    if (!requirements.allowUnitChange && !requirements.allowSquadronChange) return this.copy.lockedTitle;
    return this.step() === 'squadrons' ? this.copy.squadronLabel : this.copy.title;
  });

  readonly lead = computed(() => {
    const requirements = this.snapshot()?.requirements;
    if (!requirements) return this.copy.subtitle;
    if (requirements.contextKind === 'audit') return this.copy.auditSubtitle;
    if (!requirements.allowUnitChange && !requirements.allowSquadronChange) return this.copy.lockedSubtitle;
    if (this.step() === 'squadrons') {
      return `${this.copy.squadronLabel} · ${this.selectedUnitLabel()}`;
    }
    return this.copy.subtitle;
  });

  constructor() {
    void this.load();
  }

  selectUnit(unitId: string): void {
    const snap = this.snapshot();
    if (!snap?.requirements.allowUnitChange && snap?.identity.assignedUnitId !== unitId) return;
    this.unitId.set(unitId);
    this.squadronId.set(null);
    if (snap.requirements.squadronMode === 'hidden') return;
    this.step.set('squadrons');
  }

  selectSquadron(squadronId: string): void {
    if (!this.snapshot()?.requirements.allowSquadronChange && this.snapshot()?.identity.assignedSquadronId !== squadronId) {
      return;
    }
    this.squadronId.set(squadronId);
  }

  backToUnits(): void {
    if (!this.snapshot()?.requirements.allowUnitChange) return;
    this.step.set('units');
    this.squadronId.set(null);
  }

  async confirm(): Promise<void> {
    const userId = this.session.userId();
    if (!userId || !this.canContinue()) return;
    this.submitting.set(true);
    this.error.set(null);
    try {
      const context = await firstValueFrom(
        this.confirmProfileContext.execute(userId, {
          unitId: this.unitId(),
          squadronId: this.squadronId(),
        }),
      );
      this.session.confirmContext(context, this.presentationFromSelection());
      const next = safeInternalUrl(this.route.snapshot.queryParamMap.get('next'), LOGIN_DEFAULT_NEXT_URL);
      await this.router.navigateByUrl(next);
    } catch (err: unknown) {
      this.error.set(err instanceof DomainError ? err.message : this.copy.loadError);
    } finally {
      this.submitting.set(false);
    }
  }

  private presentationFromSelection(): OperationalContextPresentation {
    const snap = this.snapshot();
    const unit = snap?.units.find((item) => item.id === this.unitId());
    const squadronId = this.squadronId();
    if (squadronId === ALL_SQUADRONS_CONTEXT_VALUE) {
      return {
        unitName: unit?.name ?? null,
        unitImageUrl: unit?.imageUrl ?? null,
        squadronName: this.copy.allSquadrons,
        squadronImageUrl: null,
      };
    }
    const squadron = snap?.squadrons.find((item) => item.id === squadronId);
    return {
      unitName: unit?.name ?? null,
      unitImageUrl: unit?.imageUrl ?? null,
      squadronName: squadron?.name ?? null,
      squadronImageUrl: squadron?.imageUrl ?? null,
    };
  }

  private async load(): Promise<void> {
    const userId = this.session.userId();
    if (!userId) {
      await this.router.navigate([LOGIN_ROUTE]);
      return;
    }
    this.status.set('loading');
    this.error.set(null);
    try {
      const snapshot = await firstValueFrom(this.getProfileContext.execute(userId));
      this.snapshot.set(snapshot);
      this.unitId.set(snapshot.identity.assignedUnitId);
      this.squadronId.set(snapshot.identity.assignedSquadronId);
      if (snapshot.requirements.contextKind === 'audit' || snapshot.requirements.unitMode === 'hidden') {
        this.step.set('units');
      } else if (!snapshot.requirements.allowUnitChange && snapshot.identity.assignedUnitId) {
        this.step.set('squadrons');
      } else {
        this.step.set('units');
      }
      this.status.set('ready');
    } catch (err: unknown) {
      this.status.set('error');
      this.error.set(err instanceof DomainError ? err.message : this.copy.loadError);
    }
  }
}
