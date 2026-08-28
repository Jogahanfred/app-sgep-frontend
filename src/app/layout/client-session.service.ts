import { Injectable, signal } from '@angular/core';
import { SESSION_DEMO_USER_ID } from '@core/domain/entities';

const STORAGE_KEY = 'siga-session';

interface StoredSession {
  name: string;
  userId: string;
}

@Injectable({ providedIn: 'root' })
export class ClientSession {
  readonly loggedIn = signal(false);
  readonly displayName = signal('Elena');
  readonly userId = signal<string | null>(null);

  constructor() {
    this.restore();
  }

  signIn(name = 'Elena', userId = SESSION_DEMO_USER_ID): void {
    this.loggedIn.set(true);
    this.displayName.set(name);
    this.userId.set(userId);
    this.persist();
  }

  signOut(): void {
    this.loggedIn.set(false);
    this.userId.set(null);
    this.clear();
  }

  private restore(): void {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as StoredSession;
      if (!data.userId || !data.name) return;
      this.loggedIn.set(true);
      this.displayName.set(data.name);
      this.userId.set(data.userId);
    } catch {
      this.clear();
    }
  }

  private persist(): void {
    const userId = this.userId();
    if (!this.loggedIn() || !userId) {
      this.clear();
      return;
    }
    const data: StoredSession = { name: this.displayName(), userId };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  private clear(): void {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}
