import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  OnDestroy,
  viewChild,
} from '@angular/core';
import lottie, { type AnimationItem } from 'lottie-web';

@Component({
  selector: 'ui-siga-loader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ui-siga-loader.html',
  styleUrl: './ui-siga-loader.scss',
})
export class UiSigaLoader implements OnDestroy {
  readonly loop = input(true);
  readonly label = input('Cargando SIGA');
  private readonly host = viewChild.required<ElementRef<HTMLElement>>('stage');
  private animation?: AnimationItem;

  constructor() {
    afterNextRender(() => this.play());
  }

  ngOnDestroy(): void {
    this.animation?.destroy();
  }

  replay(): void {
    this.animation?.goToAndPlay(0, true);
  }

  private play(): void {
    this.animation?.destroy();
    this.animation = lottie.loadAnimation({
      container: this.host().nativeElement,
      renderer: 'svg',
      loop: this.loop(),
      autoplay: true,
      path: '/lottie/siga-loader.json?v=9',
    });
  }
}
