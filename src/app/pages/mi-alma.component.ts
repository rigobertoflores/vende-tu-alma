import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { JuegoService, Oferta, UsuarioLocal } from '../services/juego.service';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-mi-alma',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<section class="page mi-alma-page container-fluid py-4" *ngIf="usuario">
  <div class="row justify-content-center">
    <div class="col-12 col-lg-10">
      <div class="panel hero-panel card bg-transparent border-0 p-4">
        <div class="meta-row">
          <span class="badge">{{ usuario.tipo | uppercase }}</span>
          <span class="status">Activa</span>
        </div>
        <h1>{{ usuario.apodo }}</h1>
        <p class="subtitle">Créditos disponibles</p>
        <div class="wallet">
          <span>{{ usuario.creditos }}</span>
          <small>créditos</small>
        </div>
        <div class="actions-row">
          <a routerLink="/catalogo" class="action-link">Catálogo</a>
          <a routerLink="/buscar" class="action-link">Buscar</a>
        </div>
      </div>

      <div class="panel split-grid card bg-transparent border-0 p-4 mt-4">
        <div class="box">
          <h2>Mis ofertas</h2>
          <p class="loading-txt" *ngIf="cargando()">Cargando...</p>
          <ng-container *ngIf="!cargando()">
            <div *ngIf="ofertas.length; else emptyOffers" class="offer-list">
              <div class="offer-card" *ngFor="let oferta of ofertas">
                <div class="offer-card__header">
                  <span class="offer-card__title">{{ oferta.titulo }}</span>
                  <span class="cat-badge cat-{{ oferta.categoria }}">{{ oferta.categoria }}</span>
                </div>
                <p class="offer-card__desc">{{ oferta.descripcion }}</p>
                <div class="offer-card__footer">
                  <span class="offer-card__status" [class.pendiente]="oferta.ponderacion === null">
                    {{ oferta.ponderacion === null ? '⏳ Pendiente de aprobación' : oferta.ponderacion + ' créditos' }}
                  </span>
                  <span class="offer-card__activa">{{ oferta.disponible ? '● Activa' : '○ Completada' }}</span>
                </div>
              </div>
            </div>
            <ng-template #emptyOffers>
              <p class="empty-state">No tienes ofertas aún. Crea la primera para activarte en el juego.</p>
            </ng-template>
          </ng-container>
        </div>

        <form class="box" (ngSubmit)="crearOferta()">
          <h2>Agregar nueva oferta</h2>
          <label class="form-label">
            Título
            <input class="form-control" name="titulo" [(ngModel)]="titulo" maxlength="60" placeholder="Plática íntima de 2 min" [disabled]="enviando()" />
          </label>

          <label class="form-label">
            Descripción
            <textarea
              class="form-control"
              name="descripcion"
              [(ngModel)]="descripcion"
              rows="3"
              maxlength="140"
              placeholder="Escribe una descripción corta"
              [disabled]="enviando()"
            ></textarea>
          </label>

          <label class="form-label">
            Categoría
            <select class="form-select" name="categoria" [(ngModel)]="categoria" [disabled]="enviando()">
              <option value="tentador">Tentador</option>
              <option value="atrevido">Atrevido</option>
              <option value="sin-limite">Sin límites</option>
            </select>
          </label>

          <p class="msg-error" *ngIf="errorOferta()">{{ errorOferta() }}</p>
          <p class="msg-ok" *ngIf="okOferta()">{{ okOferta() }}</p>

          <button class="btn btn-primary w-100" type="submit" [disabled]="enviando()">
            {{ enviando() ? 'Subiendo...' : 'Subir oferta' }}
          </button>
          <p class="hint">La ponderación quedará pendiente hasta que el administrador la apruebe.</p>
        </form>
      </div>
    </div>
  </div>
</section>
  `,
  styles: [
    `
.page {
  min-height: calc(100vh - 4rem);
  padding: 2.5rem 1.5rem 6rem;
  display: grid;
  gap: 1.6rem;
}

.hero-panel,
.panel {
  background: rgba(17, 17, 17, 0.95);
  border: 1px solid var(--border);
  padding: 2rem;
  border-radius: 2px;
}

.meta-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 1rem;
}

.badge {
  display: inline-flex;
  padding: 0.35rem 0.85rem;
  border: 1px solid var(--border);
  color: var(--gold);
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-family: 'Cormorant SC', serif;
  font-size: 0.75rem;
}

.status {
  color: var(--text-muted);
  font-size: 0.92rem;
}

h1 {
  font-family: 'Cinzel', serif;
  font-size: clamp(2.4rem, 4vw, 3.8rem);
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.wallet {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  background: rgba(201, 168, 76, 0.08);
  padding: 1rem 1.4rem;
  border: 1px solid var(--border);
  border-radius: 2px;
  font-family: 'Cinzel', serif;
  color: var(--gold);
  font-size: 2rem;
  margin-bottom: 1.5rem;
  width: 100%;
}

.wallet small {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-family: 'Cormorant Garamond', serif;
}

.actions-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.action-link {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gold);
  border: 1px solid var(--border-strong);
  padding: 0.9rem 1rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-family: 'Cormorant SC', serif;
  font-size: 0.85rem;
  text-decoration: none;
  text-align: center;
  transition: background 0.25s, border-color 0.25s;
}

.action-link:hover {
  background: rgba(201, 168, 76, 0.07);
  border-color: var(--gold);
}

.split-grid {
  display: grid;
  gap: 1.5rem;
}

@media (min-width: 900px) {
  .split-grid {
    grid-template-columns: 1.1fr 0.9fr;
  }
}

.box {
  display: grid;
  gap: 1rem;
}

.offer-list {
  display: grid;
  gap: 1rem;
}

.offer-card {
  border: 1px solid var(--border);
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
}

.offer-card__title {
  font-family: 'Cinzel', serif;
  font-size: 1.05rem;
  color: var(--text-primary);
  margin-bottom: 0.35rem;
}

.offer-card__meta {
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
}

.offer-card__value {
  display: inline-flex;
  margin-top: 1rem;
  color: var(--gold);
  font-family: 'Cinzel', serif;
  letter-spacing: 0.12em;
}

.empty-state {
  color: var(--text-muted);
}

.loading-txt {
  color: var(--text-muted);
  font-size: 0.9rem;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.offer-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
}

.offer-card__title {
  font-family: 'Cinzel', serif;
  font-size: 0.95rem;
  color: var(--text-primary);
}

.offer-card__desc {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0 0 0.6rem;
  line-height: 1.5;
}

.offer-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.offer-card__status {
  color: var(--gold);
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  letter-spacing: 0.05em;
}

.offer-card__status.pendiente {
  color: var(--text-muted);
  font-family: 'Cormorant Garamond', serif;
  font-size: 0.85rem;
}

.offer-card__activa {
  font-size: 0.78rem;
  color: var(--text-muted);
  font-family: 'Cormorant SC', serif;
  letter-spacing: 0.1em;
}

.cat-badge {
  font-family: 'Cormorant SC', serif;
  font-size: 0.65rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 0.15rem 0.5rem;
  border-radius: 2px;
  white-space: nowrap;
  flex-shrink: 0;
}

.cat-tentador { border: 1px solid var(--border); color: var(--text-secondary); }
.cat-atrevido { border: 1px solid var(--gold-dim); color: var(--gold); }
.cat-sin-limite { border: 1px solid rgba(192,57,43,0.5); color: var(--crimson-bright); }

.msg-error {
  color: var(--crimson-bright);
  font-size: 0.85rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(192,57,43,0.3);
  background: rgba(192,57,43,0.05);
  border-radius: 2px;
}

.msg-ok {
  color: #6fcf97;
  font-size: 0.85rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(111,207,151,0.3);
  background: rgba(111,207,151,0.05);
  border-radius: 2px;
}

label {
  display: grid;
  gap: 0.5rem;
  color: var(--text-secondary);
}

input,
textarea,
select {
  width: 100%;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 0.9rem 1rem;
  border-radius: 2px;
  font: inherit;
}

textarea { min-height: 110px; resize: vertical; }

.btn-primary {
  margin-top: 0.5rem;
  background: var(--gold);
  color: var(--obsidian);
  border: none;
  padding: 1rem 1.3rem;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  cursor: pointer;
}

.hint {
  color: var(--text-muted);
  font-size: 0.9rem;
}

@media (max-width: 900px) {
  .page {
    padding: 1.5rem 1rem 2rem;
  }

  .split-grid {
    grid-template-columns: 1fr;
  }

  .hero-panel,
  .panel {
    padding: 1.25rem;
  }
}
    `
  ]
})
export class MiAlmaComponent implements OnInit {
  usuario: UsuarioLocal | null = null;
  ofertas: Oferta[] = [];
  titulo = '';
  descripcion = '';
  categoria: 'tentador' | 'atrevido' | 'sin-limite' = 'tentador';

  cargando = signal(false);
  enviando = signal(false);
  errorOferta = signal('');
  okOferta = signal('');

  constructor(
    private juego: JuegoService,
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const cached = this.juego.getUsuarioActual();
    if (!cached) {
      this.router.navigate(['/acceso']);
      return;
    }
    this.usuario = cached;
    this.refreshOfertas();
    this.api.getMe().subscribe({
      next: (u) => { this.juego.guardarUsuario(u); this.usuario = u; },
      error: () => { this.router.navigate(['/acceso']); },
    });
  }

  refreshOfertas(): void {
    this.cargando.set(true);
    this.api.getMisOfertas().subscribe({
      next: (ofertas) => {
        this.ofertas = ofertas;
        this.cargando.set(false);
      },
      error: () => {
        this.ofertas = [];
        this.cargando.set(false);
      },
    });
  }

  crearOferta(): void {
    if (!this.usuario || !this.titulo.trim() || !this.descripcion.trim()) {
      this.errorOferta.set('Completa el título y la descripción');
      return;
    }

    this.enviando.set(true);
    this.errorOferta.set('');
    this.okOferta.set('');

    this.api
      .crearOferta({
        titulo: this.titulo.trim(),
        descripcion: this.descripcion.trim(),
        categoria: this.categoria,
      })
      .subscribe({
        next: () => {
          this.titulo = '';
          this.descripcion = '';
          this.categoria = 'tentador';
          this.enviando.set(false);
          this.okOferta.set('¡Oferta subida! Pendiente de aprobación del admin.');
          this.refreshOfertas();
        },
        error: (err) => {
          this.enviando.set(false);
          const msg = (err.error as { error?: string })?.error;
          this.errorOferta.set(
            err.status === 401
              ? 'Sesión expirada. Vuelve a iniciar sesión.'
              : msg ?? 'Error al subir la oferta. Verifica que el servidor esté corriendo.'
          );
        },
      });
  }
}
