import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UiInfo } from '../ui-info/ui-info';

@Component({
  selector: 'ui-field-label',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiInfo],
  template: `
    <div class="q">
      @if (forId()) {
        <label class="q__text" [attr.for]="forId()">
          {{ label() }}
          @if (required()) {
            <span class="q__star" aria-hidden="true">*</span>
          }
        </label>
      } @else {
        <p class="q__text">
          {{ label() }}
          @if (required()) {
            <span class="q__star" aria-hidden="true">*</span>
          }
        </p>
      }
      @if (info()) {
        <ui-info [text]="info()" />
      }
    </div>
    @if (subLabel()) {
      <p class="q__sub">{{ subLabel() }}</p>
    }
  `,
  styles: `
    .q {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      margin-bottom: 0.4rem;
    }

    .q__text {
      margin: 0;
      color: #333;
      font-size: 0.92rem;
      font-weight: 400;
    }

    .q__star {
      margin-left: 0.12rem;
      color: #e11d48;
    }

    .q__sub {
      margin: -0.2rem 0 0.4rem;
      color: #9a9a9a;
      font-size: 0.8rem;
    }
  `,
})
export class UiFieldLabel {
  readonly label = input.required<string>();
  readonly info = input<string | undefined>(undefined);
  readonly forId = input<string | undefined>(undefined);
  readonly required = input(false);
  readonly subLabel = input('');
}
