import { ChangeDetectionStrategy, Component, ElementRef, effect, input, output, signal, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type { MissionSignatureMethod } from '@core/domain/entities';
import { Button } from '@shared/components/button/button';
import { Modal } from '@shared/components/modal/modal';
import { UiCheckbox } from '@shared/components/ui-checkbox/ui-checkbox';
import { UiInput } from '@shared/components/ui-input/ui-input';

export interface MissionSignatureDraft {
  method: MissionSignatureMethod;
  value: string;
}

@Component({
  selector: 'app-mission-signature-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Button, Modal, UiCheckbox, UiInput],
  templateUrl: './mission-signature-dialog.html',
  styleUrl: './mission-signature-dialog.scss',
})
export class MissionSignatureDialog {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly defaultName = input('');
  readonly copy: {
    type: string;
    draw: string;
    image: string;
    save: string;
    cancel: string;
    apply: string;
    typedPlaceholder: string;
  } = {
    type: 'Escribir',
    draw: 'Dibujar',
    image: 'Imagen',
    save: 'Guardar firma',
    cancel: 'Cancelar',
    apply: 'Aplicar',
    typedPlaceholder: 'Escriba su nombre',
  };

  readonly closed = output<void>();
  readonly applied = output<MissionSignatureDraft>();

  readonly method = signal<MissionSignatureMethod>('type');
  readonly remember = signal(true);
  readonly typedName = new FormControl('', { nonNullable: true });
  readonly typedTick = signal(0);
  readonly imageValue = signal<string | null>(null);
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('pad');
  private drawing = false;

  constructor() {
    effect(() => {
      if (this.open()) this.typedName.setValue(this.defaultName());
    });
    this.typedName.valueChanges.subscribe(() => this.typedTick.update((count) => count + 1));
  }

  selectMethod(method: MissionSignatureMethod): void {
    this.method.set(method);
  }

  onPointerDown(event: PointerEvent): void {
    const ctx = this.context();
    if (!ctx) return;
    this.drawing = true;
    ctx.beginPath();
    ctx.moveTo(event.offsetX, event.offsetY);
    (event.target as HTMLCanvasElement).setPointerCapture(event.pointerId);
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.drawing) return;
    const ctx = this.context();
    if (!ctx) return;
    ctx.lineTo(event.offsetX, event.offsetY);
    ctx.stroke();
  }

  onPointerUp(): void {
    this.drawing = false;
    this.typedTick.update((count) => count + 1);
  }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.imageValue.set(String(reader.result ?? ''));
    reader.readAsDataURL(file);
  }

  apply(): void {
    const draft = this.draft();
    if (!draft) return;
    this.applied.emit(draft);
  }

  cancel(): void {
    this.closed.emit();
  }

  canApply(): boolean {
    this.typedTick();
    this.imageValue();
    this.method();
    return this.draft() !== null;
  }

  private draft(): MissionSignatureDraft | null {
    const method = this.method();
    if (method === 'type') {
      const value = this.typedName.value.trim();
      return value ? { method, value } : null;
    }
    if (method === 'draw') {
      const value = this.canvas()?.nativeElement.toDataURL('image/png') ?? '';
      return value && !this.isBlankCanvas() ? { method, value } : null;
    }
    const value = this.imageValue();
    return value ? { method, value } : null;
  }

  private context(): CanvasRenderingContext2D | null {
    const canvas = this.canvas()?.nativeElement;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111';
    return ctx;
  }

  private isBlankCanvas(): boolean {
    const canvas = this.canvas()?.nativeElement;
    if (!canvas) return true;
    const ctx = canvas.getContext('2d');
    if (!ctx) return true;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    return !data.some((channel, index) => index % 4 === 3 && channel > 0);
  }
}
