import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-assign-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ab">
      <header class="ab__head">
        <div>
          <div class="ab__title-row">
            <h3 class="ab__title">{{ title() }}</h3>
            <ng-content select="[blockAction]" />
          </div>
          @if (hint()) {
            <p class="ab__hint">{{ hint() }}</p>
          }
        </div>
        @if (countLabel()) {
          <p class="ab__count">{{ countLabel() }}</p>
        }
      </header>
      <div class="ab__body">
        <ng-content />
      </div>
    </section>
  `,
  styleUrl: './ui-assign-block.scss',
})
export class UiAssignBlock {
  readonly title = input.required<string>();
  readonly hint = input('');
  readonly countLabel = input('');
}
