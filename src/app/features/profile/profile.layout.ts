import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Container } from '@shared/components/container/container';

@Component({
  selector: 'app-profile-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './profile.layout.html',
  styleUrl: './profile.layout.scss',
})
export class ProfileLayout {}
