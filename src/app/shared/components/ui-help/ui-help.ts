import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-help',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="ha">
      <h2>{{ title() }}</h2>
      <p>{{ body() }}</p>
      <p class="ha__phone">
        Llama al
        <a [href]="'tel:' + phoneHref()">{{ phone() }}</a>
      </p>
    </aside>
  `,
  styleUrl: './ui-help.scss',
})
export class UiHelp {
  readonly title = input('¿Tienes dudas?');
  readonly body = input('De lunes a viernes, de 8:00 a 22:00. Sábados de 9:00 a 15:00.');
  readonly phone = input('915 123 123');

  phoneHref(): string {
    return this.phone().replace(/\s+/g, '');
  }
}
