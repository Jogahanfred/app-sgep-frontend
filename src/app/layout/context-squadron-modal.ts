import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { ConfirmProfileContext, GetProfileContext, type ProfileContextSnapshot } from '@core/application';
import { ALL_SQUADRONS_CONTEXT_VALUE } from '@core/domain/entities/operational-context';
import { DomainError } from '@core/domain/errors/domain-error';
import { squadronsForUnit } from '@core/domain/services/profile-context-policy';
import { Alert } from '@shared/components/alert/alert';
import { Modal } from '@shared/components/modal/modal';
import { firstValueFrom } from 'rxjs';
import { PROFILE_CONTEXT_COPY } from '@features/profile-context/constants/profile-context.copy.constants';
import type { ProfileEmblemCardModel } from '@features/profile-context/types/profile-context.types';
import { ProfileEmblemCard } from '@features/profile-context/presentation/components/profile-emblem-card/profile-emblem-card';
import { ClientSession } from './client-session.service';

@Component({
  selector: 'app-context-squadron-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Modal, ProfileEmblemCard],
  templateUrl: './context-squadron-modal.html',
  styleUrl: './context-squadron-modal.scss',
})
export class ContextSquadronModal {
  readonly session = inject(ClientSession);
  private readonly getProfileContext = inject(GetProfileContext);
  private readonly confirmProfileContext = inject(ConfirmProfileContext);

  readonly open = input(false);
  readonly closed = output<void>();
  readonly copy = PROFILE_CONTEXT_COPY;
  readonly snapshot = signal<ProfileContextSnapshot | null>(null);
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);

  readonly squadronCards = computed<ProfileEmblemCardModel[]>(() => {
    const snap = this.snapshot();
    const unitId = this.session.unitId();
    if (!snap || !unitId) return [];
    const items = squadronsForUnit(snap.squadrons, unitId).map((squadron) => ({
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
    const unitId = this.session.unitId();
    if (!snap || !unitId) return false;
    return squadronsForUnit(snap.squadrons, unitId).length === 0;
  });

  constructor() {
    effect(() => {
      if (!this.open()) return;
      untracked(() => {
        void this.load();
      });
    });
  }

  isSelected(cardId: string): boolean {
    if (cardId === ALL_SQUADRONS_CONTEXT_VALUE) {
      return this.session.coversAllSquadrons() && !this.session.squadronId();
    }
    return this.session.squadronId() === cardId;
  }

  close(): void {
    this.closed.emit();
  }

  async selectSquadron(squadronId: string): Promise<void> {
    const userId = this.session.userId();
    const snap = this.snapshot();
    if (!userId || !snap) return;
    this.error.set(null);
    try {
      const context = await firstValueFrom(
        this.confirmProfileContext.execute(userId, {
          unitId: this.session.unitId(),
          squadronId,
        }),
      );
      const unit = snap.units.find((item) => item.id === context.unitId);
      const squadron = snap.squadrons.find((item) => item.id === squadronId);
      this.session.confirmContext(context, {
        unitName: unit?.name ?? this.session.unitName(),
        unitImageUrl: unit?.imageUrl ?? this.session.unitImageUrl(),
        squadronName: squadronId === ALL_SQUADRONS_CONTEXT_VALUE ? this.copy.allSquadrons : (squadron?.name ?? null),
        squadronImageUrl: squadron?.imageUrl ?? null,
      });
      this.close();
    } catch (err: unknown) {
      this.error.set(err instanceof DomainError ? err.message : this.copy.loadError);
    }
  }

  private async load(): Promise<void> {
    const userId = this.session.userId();
    if (!userId) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      this.snapshot.set(await firstValueFrom(this.getProfileContext.execute(userId)));
    } catch (err: unknown) {
      this.error.set(err instanceof DomainError ? err.message : this.copy.loadError);
    } finally {
      this.loading.set(false);
    }
  }
}
