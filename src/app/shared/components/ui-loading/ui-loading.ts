import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UiSigaLoader } from '../ui-siga-loader/ui-siga-loader';

@Component({
  selector: 'ui-loading',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiSigaLoader],
  templateUrl: './ui-loading.html',
  styleUrl: './ui-loading.scss',
})
export class UiLoading {
  readonly loop = input(true);
  readonly label = input('Cargando SIGA');
  readonly title = input('');
  readonly subtitle = input('');
}
