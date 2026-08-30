import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import type { ChoiceOption } from '@shared/models/choice.model';
import { Button } from '../button/button';
import { UiChip } from '../ui-chip/ui-chip';
import { UiSelect } from '../ui-select/ui-select';

export interface BoardOperation {
  id: string;
  name: string;
  description?: string;
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
  imports: [Button, UiChip, UiSelect],
  template: `
    <div class="ob">
      <section class="ob__box">
        <header class="ob__head">
          <h3>Operaciones</h3>
          <p>Elige las que estarán. El orden se cambia con Subir y Bajar.</p>
        </header>
        <div class="ob__picker">
          <ui-select
            id="ob-pick-operation"
            label="Buscar operación"
            placeholder="Nombre o descripción"
            leadingIcon="search"
            size="sm"
            [uppercase]="false"
            [filter]="true"
            [options]="availableOperations()"
            value=""
            emptyMessage="No hay operaciones disponibles."
            emptyFilterMessage="No hay operaciones con ese buscador."
            (valueChange)="pickOperation($event)"
          />
        </div>
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
                <div class="ob__who">
                  <span class="ob__num">{{ i + 1 }}</span>
                  <h4>{{ op.name }}</h4>
                </div>
                <div class="ob__sort">
                    <app-button type="button" variant="secondary" size="xs" [disabled]="i === 0" (click)="shiftOperation(op.id, -1)">
                    Subir
                  </app-button>
                  <app-button
                    type="button"
                    variant="secondary"
                    size="xs"
                    [disabled]="i === orderedOperations().length - 1"
                    (click)="shiftOperation(op.id, 1)"
                  >
                    Bajar
                  </app-button>
                  <app-button type="button" variant="ghost" size="xs" (click)="forgetOperation(op.id)">Quitar</app-button>
                </div>
              </header>
              <ol class="ob__drop">
                @for (item of maneuversIn(op.id); track item.id; let m = $index) {
                  <li
                    class="ob__row"
                    [attr.data-assigned]="item.id"
                    draggable="true"
                    (dragstart)="startDrag('maneuver', item.id, $event)"
                    (dragover)="allowMan($event)"
                    (drop)="dropOnAssigned(op.id, item.id, $event)"
                  >
                    <ui-chip [label]="item.label" />
                    <div class="ob__sort">
                      <app-button
                        type="button"
                        variant="secondary"
                        size="xs"
                        [disabled]="m === 0"
                        (click)="shiftAssigned(op.id, item.id, -1)"
                      >
                        Subir
                      </app-button>
                      <app-button
                        type="button"
                        variant="secondary"
                        size="xs"
                        [disabled]="m === maneuversIn(op.id).length - 1"
                        (click)="shiftAssigned(op.id, item.id, 1)"
                      >
                        Bajar
                      </app-button>
                      <app-button type="button" variant="ghost" size="xs" (click)="place(item.id, null)">Quitar</app-button>
                    </div>
                  </li>
                } @empty {
                  <li class="ob__hint">Suelta aquí una maniobra</li>
                }
              </ol>
            </li>
          } @empty {
            <li class="ob__hint">Busca arriba para elegir las operaciones que estarán.</li>
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
          @for (item of poolManeuvers(); track item.id) {
            <li
              class="ob__chip"
              [attr.data-man]="item.id"
              draggable="true"
              (dragstart)="startDrag('maneuver', item.id, $event)"
            >
              <ui-chip [label]="item.label" />
            </li>
          } @empty {
            <li class="ob__hint">{{ maneuvers().length ? 'Todas están en una operación. Arrástralas desde ahí.' : 'No hay maniobras seleccionadas.' }}</li>
          }
        </ul>
      </section>
    </div>
  `,
  styleUrl: './ui-operation-board.scss',
})
export class UiOperationBoard {
  readonly catalog = input.required<BoardOperation[]>();
  readonly maneuvers = input.required<BoardManeuver[]>();
  readonly order = input<readonly string[]>([]);
  readonly maneuverOrder = input<readonly string[]>([]);
  readonly assignment = input<Readonly<Record<string, string>>>({});
  readonly orderChange = output<string[]>();
  readonly maneuverOrderChange = output<string[]>();
  readonly assignmentChange = output<Record<string, string>>();
  readonly removeManeuver = output<string>();

  readonly hoverOp = signal<string | null>(null);
  private drag: DragPayload | null = null;

  readonly orderedOperations = computed(() => {
    const items = this.catalog();
    const byId = new Map(items.map((item) => [item.id, item]));
    return this.order()
      .map((id) => byId.get(id))
      .filter((item): item is BoardOperation => !!item);
  });

  readonly availableOperations = computed<ChoiceOption[]>(() => {
    const chosen = new Set(this.order());
    return this.catalog()
      .filter((item) => !chosen.has(item.id))
      .map((item) => ({
        value: item.id,
        label: item.name,
        hint: item.description,
      }));
  });

  readonly orderedManeuvers = computed(() => {
    const items = this.maneuvers();
    const byId = new Map(items.map((item) => [item.id, item]));
    const order = this.maneuverOrder();
    if (!order.length) return items;
    const seen = new Set<string>();
    const sorted: BoardManeuver[] = [];
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

  readonly poolManeuvers = computed(() => {
    const assigned = this.assignment();
    return this.orderedManeuvers().filter((item) => !assigned[item.id]);
  });

  maneuversIn(operationId: string): BoardManeuver[] {
    const assigned = this.assignment();
    return this.orderedManeuvers().filter((item) => assigned[item.id] === operationId);
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

  allowMan(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
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

  dropOnAssigned(operationId: string, beforeId: string, event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const payload = this.readPayload(event);
    if (payload?.kind !== 'maneuver') return;
    if (this.assignment()[payload.id] !== operationId) {
      this.place(payload.id, operationId);
    }
    if (payload.id === beforeId) return;
    this.moveAssigned(operationId, payload.id, beforeId);
  }

  clearOver(): void {
    this.hoverOp.set(null);
    this.drag = null;
  }

  pickOperation(operationId: string): void {
    if (!operationId || this.order().includes(operationId)) return;
    this.orderChange.emit([...this.order(), operationId]);
  }

  forgetOperation(operationId: string): void {
    this.orderChange.emit(this.order().filter((id) => id !== operationId));
    const next = { ...this.assignment() };
    for (const [maneuverId, assigned] of Object.entries(next)) {
      if (assigned === operationId) delete next[maneuverId];
    }
    this.assignmentChange.emit(next);
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

  shiftAssigned(operationId: string, maneuverId: string, delta: number): void {
    const local = this.maneuversIn(operationId).map((item) => item.id);
    const from = local.indexOf(maneuverId);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= local.length) return;
    const [item] = local.splice(from, 1);
    local.splice(to, 0, item);
    this.writeAssignedOrder(operationId, local);
  }

  private moveAssigned(operationId: string, maneuverId: string, beforeId: string): void {
    const local = this.maneuversIn(operationId).map((item) => item.id);
    if (!local.includes(maneuverId)) local.push(maneuverId);
    const from = local.indexOf(maneuverId);
    const to = local.indexOf(beforeId);
    if (from < 0 || to < 0 || from === to) return;
    local.splice(from, 1);
    local.splice(to, 0, maneuverId);
    this.writeAssignedOrder(operationId, local);
  }

  private writeAssignedOrder(operationId: string, local: string[]): void {
    const assigned = this.assignment();
    const current = this.orderedManeuvers().map((item) => item.id);
    const others = current.filter((id) => !local.includes(id));
    const anchor = current.findIndex((id) => assigned[id] === operationId || local.includes(id));
    if (anchor < 0) {
      this.maneuverOrderChange.emit([...others, ...local]);
      return;
    }
    const before = others.filter((id) => current.indexOf(id) < anchor);
    const after = others.filter((id) => current.indexOf(id) >= anchor);
    this.maneuverOrderChange.emit([...before, ...local, ...after]);
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
