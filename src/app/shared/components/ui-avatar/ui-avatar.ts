import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { profileInitials } from '@core/domain/services/user-profile';
import type { UiAvatarRadius, UiAvatarSize } from '@shared/types/ui-avatar.types';

@Component({
  selector: 'ui-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ui-avatar.html',
  styleUrl: './ui-avatar.scss',
  host: {
    '[style.--av-radius]': 'radiusCss()',
  },
})
export class UiAvatar {
  readonly name = input.required<string>();
  readonly src = input<string | null>(null);
  readonly size = input<UiAvatarSize>('md');
  readonly radius = input<UiAvatarRadius | null>(null);
  readonly shape = input<'circle' | 'rounded'>('circle');
  readonly marker = input(false);

  readonly initials = computed(() => {
    const parts = this.name().trim().split(/\s+/);
    return profileInitials(parts[0] ?? '', parts[1] ?? parts[0] ?? '');
  });

  readonly resolvedRadius = computed<UiAvatarRadius>(() => {
    const radius = this.radius();
    if (radius) return radius;
    return this.shape() === 'rounded' ? 'sm' : 'circle';
  });

  readonly radiusCss = computed(() => {
    const radius = this.resolvedRadius();
    if (radius === 'circle') return '50%';
    if (radius === 'sm') return 'var(--radius-sm)';
    if (radius === 'md') return 'var(--radius-md)';
    return 'var(--radius-lg)';
  });
}
