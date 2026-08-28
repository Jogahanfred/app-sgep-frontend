import { Injectable, signal } from '@angular/core';
import { SESSION_DEMO_USER_ID } from '@core/domain/entities';

@Injectable({ providedIn: 'root' })
export class ClientSession {
  readonly loggedIn = signal(false);
  readonly displayName = signal('Elena');
  readonly userId = signal<string | null>(null);

  signIn(name = 'Elena', userId = SESSION_DEMO_USER_ID): void {
    this.loggedIn.set(true);
    this.displayName.set(name);
    this.userId.set(userId);
  }

  signOut(): void {
    this.loggedIn.set(false);
    this.userId.set(null);
  }
}
