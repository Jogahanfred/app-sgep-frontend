import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { GetProgrammingBoard } from '@core/application';
import type { OperationalContext } from '@core/domain/entities/operational-context';
import { Alert } from '@shared/components/alert/alert';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { ClientSession } from '@layout/client-session.service';
import { PROGRAMMING_COPY } from '../../../constants/programming.copy.constants';

@Component({
  selector: 'app-programming-board-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, RouterOutlet, UiLoading],
  templateUrl: './programming-board.page.html',
  styleUrl: './programming-board.page.scss',
})
export class ProgrammingBoardPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly board = inject(GetProgrammingBoard);
  private readonly session = inject(ClientSession);

  readonly copy = PROGRAMMING_COPY;
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly needsSquadron = signal(false);

  constructor() {
    const context = this.operationalContext();
    if (!context) {
      this.loadState.set('error');
      return;
    }
    this.board
      .execute(context)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (snapshot) => {
          this.needsSquadron.set(snapshot.needsSquadron);
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
  }

  private operationalContext(): OperationalContext | null {
    return this.session.operationalContext();
  }
}
