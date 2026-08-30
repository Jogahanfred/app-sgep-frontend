import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import type { ChoiceOption } from '@shared/models/choice.model';
import { Button } from '../button/button';
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
  imports: [Button, UiSelect],
  template: `
    <div class="ob">
      <section class="ob__box">
        <header class="ob__head">
          <h3>Operaciones</h3>
          <p>Busca y elige las operaciones que estarán en el cuadro. Luego ordénalas.</p>
        </header>
        <div class="ob__picker">
          <ui-select
            id="ob-pick-operation"
            label="Buscar operación"
            placeholder="Nombre o descripción"
            leadingIcon="search"
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
                  <app-button type="button" variant="secondary" size="sm" [disabled]="i === 0" (click)="shiftOperation(op.id, -1)">
                    Subir
                  </app-button>
                  <app-button
                    type="button"
                    variant="secondary"
                    size="sm"
                    [disabled]="i === orderedOperations().length - 1"
                    (click)="shiftOperation(op.id, 1)"
                  >
                    Bajar
                  </app-button>
                  <app-button type="button" variant="ghost" size="sm" (click)="forgetOperation(op.id)">Quitar</app-button>
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
          } @empty {
            <li class="ob__hint">Busca arriba para elegir las operaciones que estarán.</li>
          }
        </ol>
      </section>

      <section class="ob__box">
        <header class="ob__head">
          <h3>Maniobras</h3>
          <p>Todas las seleccionadas. Arrástralas a una operación para agruparlas.</p>
        </header>
        <ul
          class="ob__pool"
          (dragover)="allowPool($event)"
          (drop)="dropOnPool($event)"
        >
          @for (item of maneuvers(); track item.id) {
            <li
              class="ob__chip"
              [class.ob__chip--used]="!!assignment()[item.id]"
              draggable="true"
              (dragstart)="startDrag('maneuver', item.id, $event)"
            >
              <span>{{ item.label }}</span>
              <app-button type="button" size="xs" [disabled]="!!item.added" (click)="addManeuver.emit(item.id)">
                Añadir
              </app-button>
            </li>
          } @empty {
            <li class="ob__hint">No hay maniobras seleccionadas.</li>
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
  readonly assignment = input<Readonly<Record<string, string>>>({});
  readonly orderChange = output<string[]>();
  readonly assignmentChange = output<Record<string, string>>();
  readonly addManeuver = output<string>();

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
        label: item.description ? `${item.name} · ${item.description}` : item.name,
      }));
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
