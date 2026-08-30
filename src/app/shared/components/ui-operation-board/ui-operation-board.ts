import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Button } from '../button/button';

export interface BoardOperation {
  id: string;
  name: string;
}

export interface BoardManeuver {
  id: string;
  label: string;
  added?: boolean;
}

type DragPayload = { kind: 'maneuver' | 'operation'; id: string };

@Component({
  selector: 'ui-operation-board',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button],
  template: `
    <div class="ob">
      <section class="ob__box">
        <header class="ob__head">
          <h3>Operaciones</h3>
          <p>Arrastra una operación para cambiar el orden. Suelta una maniobra dentro para agruparla.</p>
        </header>
        <ol class="ob__ops">
          @for (op of orderedOperations(); track op.id; let i = $index) {
            <li
              class="ob__op"
              [class.ob__op--over]="hoverOp() === op.id"
              [attr.data-op]="op.id"
              draggable="true"
              (dragstart)="startDrag('operation', op.id, $event)"
              (dragend)="clearOver()"
              (dragover)="allowDrop($event, op.id)"
              (dragleave)="leaveOp(op.id)"
              (drop)="dropOnOp(op.id, $event)"
            >
              <header class="ob__op-head">
                <span class="ob__num">{{ i + 1 }}</span>
                <h4>{{ op.name }}</h4>
                <div class="ob__sort">
                  <button type="button" [disabled]="i === 0" aria-label="Subir operación" (click)="shiftOperation(op.id, -1)">
                    ↑
                  </button>
                  <button
                    type="button"
                    [disabled]="i === orderedOperations().length - 1"
                    aria-label="Bajar operación"
                    (click)="shiftOperation(op.id, 1)"
                  >
                    ↓
                  </button>
                </div>
              </header>
              <ul class="ob__drop">
                @for (item of maneuversIn(op.id); track item.id) {
                  <li
                    class="ob__chip"
                    draggable="true"
                    (dragstart)="startDrag('maneuver', item.id, $event)"
                  >
                    <span>{{ item.label }}</span>
                    <app-button type="button" size="xs" [disabled]="!!item.added" (click)="addManeuver.emit(item.id)">
                      Añadir
                    </app-button>
                  </li>
                } @empty {
                  <li class="ob__hint">Suelta aquí una maniobra</li>
                }
              </ul>
            </li>
          }
        </ol>
      </section>

      <section class="ob__box">
        <header class="ob__head">
          <h3>Maniobras</h3>
          <p>Arrástralas a una operación para agruparlas.</p>
        </header>
        <ul
          class="ob__pool"
          (dragover)="allowPool($event)"
          (drop)="dropOnPool($event)"
        >
          @for (item of pool(); track item.id) {
            <li class="ob__chip" draggable="true" (dragstart)="startDrag('maneuver', item.id, $event)">
              <span>{{ item.label }}</span>
              <app-button type="button" size="xs" [disabled]="!!item.added" (click)="addManeuver.emit(item.id)">
                Añadir
              </app-button>
            </li>
          } @empty {
            <li class="ob__hint">Todas las maniobras están en una operación.</li>
          }
        </ul>
      </section>
    </div>
  `,
  styleUrl: './ui-operation-board.scss',
})
export class UiOperationBoard {
  readonly operations = input.required<BoardOperation[]>();
  readonly maneuvers = input.required<BoardManeuver[]>();
  readonly order = input<readonly string[]>([]);
  readonly assignment = input<Readonly<Record<string, string>>>({});
  readonly orderChange = output<string[]>();
  readonly assignmentChange = output<Record<string, string>>();
  readonly addManeuver = output<string>();

  readonly hoverOp = signal<string | null>(null);
  private drag: DragPayload | null = null;

  readonly orderedOperations = computed(() => {
    const items = this.operations();
    const order = this.order();
    const byId = new Map(items.map((item) => [item.id, item]));
    const seen = new Set<string>();
    const sorted: BoardOperation[] = [];
    for (const id of order) {
      const item = byId.get(id);
      if (item) {
        sorted.push(item);
        seen.add(id);
      }
    }
    for (const item of items) {
      if (!seen.has(item.id)) sorted.push(item);
    }
    return sorted;
  });

  readonly pool = computed(() => {
    const assigned = this.assignment();
    return this.maneuvers().filter((item) => !assigned[item.id]);
  });

  maneuversIn(operationId: string): BoardManeuver[] {
    const assigned = this.assignment();
    return this.maneuvers().filter((item) => assigned[item.id] === operationId);
  }

  startDrag(kind: DragPayload['kind'], id: string, event: DragEvent): void {
    this.drag = { kind, id };
    event.dataTransfer?.setData('text/plain', JSON.stringify(this.drag));
    try {
      event.dataTransfer?.setDragImage((event.currentTarget as HTMLElement) ?? document.body, 12, 12);
    } catch {
      /* jsdom no soporta setDragImage */
    }
    if (event.dataTransfer) event.dataTransfer.effectAllowed = kind === 'operation' ? 'move' : 'copyMove';
    event.stopPropagation();
  }

  allowDrop(event: DragEvent, operationId: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.hoverOp.set(operationId);
  }

  leaveOp(operationId: string): void {
    if (this.hoverOp() === operationId) this.hoverOp.set(null);
  }

  allowPool(event: DragEvent): void {
    event.preventDefault();
  }

  dropOnOp(operationId: string, event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const payload = this.readPayload(event);
    this.hoverOp.set(null);
    if (!payload) return;
    if (payload.kind === 'maneuver') {
      this.place(payload.id, operationId);
      return;
    }
    this.reorder(payload.id, operationId);
  }

  dropOnPool(event: DragEvent): void {
    event.preventDefault();
    const payload = this.readPayload(event);
    if (payload?.kind === 'maneuver') this.place(payload.id, null);
  }

  clearOver(): void {
    this.hoverOp.set(null);
    this.drag = null;
  }

  place(maneuverId: string, operationId: string | null): void {
    const next = { ...this.assignment() };
    if (!operationId) delete next[maneuverId];
    else next[maneuverId] = operationId;
    this.assignmentChange.emit(next);
  }

  reorder(operationId: string, beforeId: string): void {
    if (operationId === beforeId) return;
    const ids = this.orderedOperations().map((item) => item.id);
    const from = ids.indexOf(operationId);
    const to = ids.indexOf(beforeId);
    if (from < 0 || to < 0) return;
    ids.splice(from, 1);
    ids.splice(to, 0, operationId);
    this.orderChange.emit(ids);
  }

  shiftOperation(operationId: string, delta: number): void {
    const ids = this.orderedOperations().map((item) => item.id);
    const from = ids.indexOf(operationId);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= ids.length) return;
    const [item] = ids.splice(from, 1);
    ids.splice(to, 0, item);
    this.orderChange.emit(ids);
  }

  private readPayload(event: DragEvent): DragPayload | null {
    const raw = event.dataTransfer?.getData('text/plain') || (this.drag ? JSON.stringify(this.drag) : '');
    try {
      const data = JSON.parse(raw) as DragPayload;
      if (data.kind === 'maneuver' || data.kind === 'operation') return data;
    } catch {
      return this.drag;
    }
    return this.drag;
  }
}
