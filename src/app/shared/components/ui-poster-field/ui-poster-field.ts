import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

@Component({
  selector: 'ui-poster-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ui-poster-field.html',
  styleUrl: './ui-poster-field.scss',
})
export class UiPosterField {
  readonly label = input('Póster');
  readonly hint = input('JPEG, PNG o WebP. Máximo 2 MB.');
  readonly emptyText = input('Arrastra una imagen o elige un archivo para el póster.');
  readonly value = input('');
  readonly alt = input('Póster');
  readonly disabled = input(false);
  readonly error = input<string | undefined>(undefined);
  readonly valueChange = output<string>();
  readonly reject = output<string>();

  readonly over = signal(false);

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    this.readFile(file);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.over.set(false);
    if (this.disabled()) return;
    this.readFile(event.dataTransfer?.files?.[0]);
  }

  allowDrop(event: DragEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    this.over.set(true);
  }

  leave(): void {
    this.over.set(false);
  }

  private readFile(file: File | undefined): void {
    if (!file || this.disabled()) return;
    if (!file.type.startsWith('image/')) {
      this.reject.emit('Elige una imagen JPEG, PNG o WebP.');
      return;
    }
    if (file.size > 2_000_000) {
      this.reject.emit('La imagen no puede superar 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => this.valueChange.emit(String(reader.result));
    reader.readAsDataURL(file);
  }
}
