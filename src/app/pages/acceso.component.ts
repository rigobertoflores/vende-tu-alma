import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { JuegoService } from '../services/juego.service';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-acceso',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<section class="page">
  <div class="card">
    <span class="eyebrow">Acceso nocturno</span>
    <h1>Entra al juego</h1>
    <p class="sub">Usa el apodo y contraseña que el administrador te asignó.</p>

    <form (ngSubmit)="entrar()">
      <label class="field-label">
        Tu apodo
        <input class="field-input" name="apodo" [(ngModel)]="apodo"
          required maxlength="30" placeholder="Apodo asignado"
          autocomplete="username" [disabled]="loading()" />
      </label>

      <label class="field-label">
        Contraseña
        <input class="field-input" name="password" [(ngModel)]="password"
          type="password" required placeholder="Contraseña asignada"
          autocomplete="current-password" [disabled]="loading()" />
      </label>

      <div class="error-msg" *ngIf="errorMsg()">{{ errorMsg() }}</div>

      <button class="btn-primary" type="submit" [disabled]="loading()">
        {{ loading() ? 'Verificando...' : 'Entrar al bar' }}
      </button>
    </form>

    <p class="hint">Tu sesión se cierra al terminar la noche.</p>
  </div>
</section>
  `,
  styles: [`
.page {
  min-height: calc(100dvh - 3.5rem);
  padding: 1.5rem 1rem 2rem;
  display: grid;
  align-content: center;
}

.card {
  background: rgba(17,17,17,0.96);
  border: 1px solid var(--border);
  border-radius: 2px;
  padding: 1.75rem 1.5rem;
  max-width: 440px;
  width: 100%;
  margin: 0 auto;
  display: grid;
  gap: 1.1rem;
}

.eyebrow {
  font-family: 'Cormorant SC', serif;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  font-size: 0.7rem;
  color: var(--gold);
}

h1 {
  font-family: 'Cinzel', serif;
  font-size: clamp(1.8rem, 5vw, 2.6rem);
  line-height: 1.1;
  margin: 0;
}

.sub {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.6;
  margin: 0;
}

form { display: grid; gap: 1rem; }

.field-label {
  display: grid;
  gap: 0.45rem;
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-family: 'Cormorant SC', serif;
  letter-spacing: 0.05em;
}

.field-input {
  width: 100%;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 0.85rem 1rem;
  border-radius: 2px;
  font: inherit;
  font-size: 1rem;
  transition: border-color 0.2s;
}
.field-input:focus { border-color: var(--gold); outline: none; }
.field-input:disabled { opacity: 0.5; }

.error-msg {
  color: var(--crimson-bright);
  font-size: 0.88rem;
  padding: 0.6rem 0.8rem;
  border: 1px solid rgba(192,57,43,0.4);
  border-radius: 2px;
  background: rgba(192,57,43,0.06);
}

.btn-primary {
  background: var(--gold);
  color: var(--obsidian);
  border: none;
  padding: 1rem;
  width: 100%;
  font-family: 'Cinzel', serif;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  cursor: pointer;
  font-size: 0.88rem;
  transition: opacity 0.2s;
}
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.hint {
  color: var(--text-muted);
  font-size: 0.8rem;
  text-align: center;
}
  `]
})
export class AccesoComponent {
  apodo = '';
  password = '';
  loading = signal(false);
  errorMsg = signal('');

  constructor(
    private router: Router,
    private juego: JuegoService,
    private api: ApiService
  ) {}

  entrar(): void {
    if (!this.apodo.trim()) { this.errorMsg.set('El apodo es obligatorio'); return; }
    if (!this.password.trim()) { this.errorMsg.set('La contraseña es obligatoria'); return; }

    this.loading.set(true);
    this.errorMsg.set('');

    this.api.login(this.apodo.trim(), this.password.trim()).subscribe({
      next: ({ usuario, token }) => {
        this.api.setToken(token);
        this.juego.guardarUsuario(usuario);
        this.router.navigate(['/mi-alma']);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 0) { this.errorMsg.set('No se pudo conectar con el servidor'); return; }
        if (err.status === 401) { this.errorMsg.set('Apodo o contraseña incorrectos'); return; }
        this.errorMsg.set((err.error as { error?: string })?.error ?? 'Error inesperado');
      },
    });
  }
}
