import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { profileInitials } from '@core/domain/services/user-profile';

@Component({
  selector: 'ui-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="av" [class]="'av--' + size()" [attr.aria-label]="name()">
      @if (src()) {
        <img [src]="src()" [alt]="'Foto de ' + name()" />
      } @else {
        <span aria-hidden="true">{{ initials() }}</span>
      }
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    .av {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-radius: 50%;
      background: #d4e4f0;
      color: var(--color-primary);
      font-weight: 800;
      letter-spacing: 0.02em;
    }

    .av--sm {
      width: 2rem;
      height: 2rem;
      font-size: 0.72rem;
    }

    .av--md {
      width: 3.25rem;
      height: 3.25rem;
      font-size: 1rem;
    }

    .av--lg {
      width: 7rem;
      height: 7rem;
      font-size: 1.8rem;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `,
})
export class UiAvatar {
  readonly name = input.required<string>();
  readonly src = input<string | null>(null);
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  readonly initials = computed(() => {
    const parts = this.name().trim().split(/\s+/);
    return profileInitials(parts[0] ?? '', parts[1] ?? parts[0] ?? '');
  });
}
