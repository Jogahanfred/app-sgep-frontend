import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Container } from '@shared/components/container/container';

@Component({
  selector: 'app-catalog-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './catalog.layout.html',
  styleUrl: './catalog.layout.scss',
})
export class CatalogLayout {}
