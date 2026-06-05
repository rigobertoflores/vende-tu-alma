import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { JuegoService } from './services/juego.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  private readonly router = inject(Router);
  private readonly juego = inject(JuegoService);

  currentUrl = signal(this.router.url);
  credits = computed(() => this.juego.getUsuarioActual()?.creditos ?? 0);
  hasUser = computed(() => this.juego.getUsuarioActual() !== null);
  showTopBar = computed(() => {
    const path = this.currentUrl().split('?')[0].split('#')[0];
    return path !== '/' && path !== '/admin';
  });
  showBottomNav = computed(() => {
    const path = this.currentUrl().split('?')[0].split('#')[0];
    return path !== '/' && path !== '/admin';
  });

  constructor() {
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe((event) => {
      this.currentUrl.set(event.urlAfterRedirects);
    });
  }
}
