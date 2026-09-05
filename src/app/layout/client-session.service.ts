import { Injectable, signal } from '@angular/core';
import { SESSION_DEMO_USER_ID } from '@core/domain/entities';
import type { OperationalContext, OperationalIdentity } from '@core/domain/entities/operational-context';
import type { RoleCode } from '@core/domain/entities/role-code';

const STORAGE_KEY = 'siga-session';

export interface OperationalContextPresentation {
  unitName: string | null;
  unitImageUrl: string | null;
  squadronName: string | null;
  squadronImageUrl: string | null;
}

interface StoredSession {
  name: string;
  userId: string;
  roleCode?: RoleCode;
  assignedUnitId?: string | null;
  assignedSquadronId?: string | null;
  unitId?: string | null;
  squadronId?: string | null;
  coversAllSquadrons?: boolean;
  contextConfirmed?: boolean;
  unitName?: string | null;
  unitImageUrl?: string | null;
  squadronName?: string | null;
  squadronImageUrl?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ClientSession {
  readonly loggedIn = signal(false);
  readonly displayName = signal('Elena');
  readonly userId = signal<string | null>(null);
  readonly roleCode = signal<RoleCode | null>(null);
  readonly assignedUnitId = signal<string | null>(null);
  readonly assignedSquadronId = signal<string | null>(null);
  readonly unitId = signal<string | null>(null);
  readonly squadronId = signal<string | null>(null);
  readonly coversAllSquadrons = signal(false);
  readonly contextConfirmed = signal(false);
  readonly unitName = signal<string | null>(null);
  readonly unitImageUrl = signal<string | null>(null);
  readonly squadronName = signal<string | null>(null);
  readonly squadronImageUrl = signal<string | null>(null);

  constructor() {
    this.restore();
  }

  hasOperationalContext(): boolean {
    return this.loggedIn() && this.contextConfirmed();
  }

  operationalContext(): OperationalContext | null {
    const userId = this.userId();
    const roleCode = this.roleCode();
    if (!userId || !roleCode) return null;
    return {
      userId,
      displayName: this.displayName(),
      roleCode,
      assignedUnitId: this.assignedUnitId(),
      assignedSquadronId: this.assignedSquadronId(),
      unitId: this.unitId(),
      squadronId: this.squadronId(),
      coversAllSquadrons: this.coversAllSquadrons(),
    };
  }

  signIn(name = 'Elena', userId = SESSION_DEMO_USER_ID): void {
    this.loggedIn.set(true);
    this.displayName.set(name);
    this.userId.set(userId);
    this.persist();
  }

  signInIdentity(identity: OperationalIdentity): void {
    this.loggedIn.set(true);
    this.displayName.set(identity.displayName);
    this.userId.set(identity.userId);
    this.roleCode.set(identity.roleCode);
    this.assignedUnitId.set(identity.assignedUnitId);
    this.assignedSquadronId.set(identity.assignedSquadronId);
    this.unitId.set(null);
    this.squadronId.set(null);
    this.coversAllSquadrons.set(false);
    this.contextConfirmed.set(false);
    this.clearPresentation();
    this.persist();
  }

  confirmContext(context: OperationalContext, presentation?: OperationalContextPresentation): void {
    this.displayName.set(context.displayName);
    this.userId.set(context.userId);
    this.roleCode.set(context.roleCode);
    this.assignedUnitId.set(context.assignedUnitId);
    this.assignedSquadronId.set(context.assignedSquadronId);
    this.unitId.set(context.unitId);
    this.squadronId.set(context.squadronId);
    this.coversAllSquadrons.set(context.coversAllSquadrons);
    this.contextConfirmed.set(true);
    this.loggedIn.set(true);
    if (presentation) {
      this.unitName.set(presentation.unitName);
      this.unitImageUrl.set(presentation.unitImageUrl);
      this.squadronName.set(presentation.squadronName);
      this.squadronImageUrl.set(presentation.squadronImageUrl);
    }
    this.persist();
  }

  signOut(): void {
    this.loggedIn.set(false);
    this.userId.set(null);
    this.roleCode.set(null);
    this.assignedUnitId.set(null);
    this.assignedSquadronId.set(null);
    this.unitId.set(null);
    this.squadronId.set(null);
    this.coversAllSquadrons.set(false);
    this.contextConfirmed.set(false);
    this.clearPresentation();
    this.clear();
  }

  private restore(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as StoredSession;
      if (!data.userId || !data.name) return;
      this.loggedIn.set(true);
      this.displayName.set(data.name);
      this.userId.set(data.userId);
      this.roleCode.set(data.roleCode ?? null);
      this.assignedUnitId.set(data.assignedUnitId ?? null);
      this.assignedSquadronId.set(data.assignedSquadronId ?? null);
      this.unitId.set(data.unitId ?? null);
      this.squadronId.set(data.squadronId ?? null);
      this.coversAllSquadrons.set(data.coversAllSquadrons === true);
      this.contextConfirmed.set(data.contextConfirmed === true);
      this.unitName.set(data.unitName ?? null);
      this.unitImageUrl.set(data.unitImageUrl ?? null);
      this.squadronName.set(data.squadronName ?? null);
      this.squadronImageUrl.set(data.squadronImageUrl ?? null);
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
    const data: StoredSession = {
      name: this.displayName(),
      userId,
      roleCode: this.roleCode() ?? undefined,
      assignedUnitId: this.assignedUnitId(),
      assignedSquadronId: this.assignedSquadronId(),
      unitId: this.unitId(),
      squadronId: this.squadronId(),
      coversAllSquadrons: this.coversAllSquadrons(),
      contextConfirmed: this.contextConfirmed(),
      unitName: this.unitName(),
      unitImageUrl: this.unitImageUrl(),
      squadronName: this.squadronName(),
      squadronImageUrl: this.squadronImageUrl(),
    };
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  private clearPresentation(): void {
    this.unitName.set(null);
    this.unitImageUrl.set(null);
    this.squadronName.set(null);
    this.squadronImageUrl.set(null);
  }

  private clear(): void {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  }
}
