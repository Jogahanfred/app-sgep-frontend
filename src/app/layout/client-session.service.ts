import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ClientSession {
  readonly loggedIn = signal(false);
  readonly displayName = signal('Elena');

  signIn(name = 'Elena'): void {
    this.loggedIn.set(true);
    this.displayName.set(name);
  }

  signOut(): void {
    this.loggedIn.set(false);
  }
}
