import { Component, OnInit, signal } from '@angular/core';
import { JuegoService, Oferta, UsuarioLocal } from '../services/juego.service';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [],
  template: `
@if (tratoConfirmado()) {
  <div class="reclamo-overlay" (click)="cerrarReclamo()">
    <div class="reclamo-card" (click)="$event.stopPropagation()">
      <div class="reclamo-orb">♦</div>
      <p class="reclamo-sello">Trato sellado</p>
      <h2 class="reclamo-titulo">{{ tratoConfirmado()!.titulo }}</h2>
      <p class="reclamo-vendedor">con <strong>{{ tratoConfirmado()!.vendedor_apodo }}</strong></p>
      <div class="reclamo-cta">
        <span class="reclamo-flecha">↓</span>
        <p class="reclamo-accion">IR A RECLAMAR LA OFERTA</p>
        <span class="reclamo-flecha">↓</span>
      </div>
      <p class="reclamo-hint">Encuentra a {{ tratoConfirmado()!.vendedor_apodo }} y muéstrale esta pantalla</p>
      <button class="reclamo-cerrar" (click)="cerrarReclamo()">Entendido</button>
    </div>
  </div>
}

<section class="page">
  <header class="hero-panel">
    <div class="hero-text">
      <span class="eyebrow">Catálogo</span>
      <h1>Almas disponibles</h1>
      <p>Explora las ofertas activas y cierra el trato.</p>
    </div>
    <div class="credit-pill">
      <span class="credit-num">{{ usuario?.creditos ?? 0 }}</span>
      <small>créditos</small>
    </div>
  </header>

  <div class="filters-wrap">
    <div class="filters">
      @for (option of categorias; track option.value) {
        <button class="filter-btn" (click)="setCategoria(option.value)"
          [class.active]="selectedCategoria === option.value">
          {{ option.label }}
        </button>
      }
    </div>
  </div>

  @if (tratoOk()) {
    <div class="toast toast-ok">♦ {{ tratoOk() }}</div>
  }
  @if (tratoError()) {
    <div class="toast toast-error">{{ tratoError() }}</div>
  }

  @if (cargando()) {
    <div class="loading-state">
      <span class="loading-dot">·</span><span class="loading-dot">·</span><span class="loading-dot">·</span>
      Cargando ofertas
    </div>
  } @else if (errorMsg()) {
    <div class="error-state">
      <p>{{ errorMsg() }}</p>
      <button class="btn-ghost" (click)="cargarOfertas()">Reintentar</button>
    </div>
  } @else if (filteredOfertas.length) {
    <div class="grid">
      @for (oferta of filteredOfertas; track oferta.id) {
        <article class="offer-card">
          <div class="meta-row">
            <span class="tier tier-{{ oferta.categoria }}">{{ oferta.categoria }}</span>
            <span class="vendor">{{ oferta.vendedor_apodo }}</span>
          </div>
          <h2>{{ oferta.titulo }}</h2>
          <p>{{ oferta.descripcion }}</p>
          <div class="details-row">
            <span class="price">{{ oferta.ponderacion }} cr</span>
            @if ((usuario?.creditos ?? 0) < (oferta.ponderacion ?? 0)) {
              <button class="btn-insuficiente" disabled>Créditos insuficientes</button>
            } @else {
              <button class="btn-primary"
                [disabled]="procesandoId() === oferta.id"
                (click)="interesado(oferta)">
                {{ procesandoId() === oferta.id ? 'Procesando...' : 'Me interesa' }}
              </button>
            }
          </div>
        </article>
      }
    </div>
  } @else {
    <div class="empty-state">
      <p>No hay ofertas disponibles en este momento.</p>
      <p class="empty-hint">Las ofertas aparecen aquí una vez que el admin las aprueba.</p>
    </div>
  }
</section>
  `,
  styles: [`
:host {
  --neon: #BF5FFF;
  --neon-dim: #7B35CC;
  --neon-glow: rgba(191,95,255,0.35);
  --neon-faint: rgba(191,95,255,0.08);
  display: block;
}

/* ── Base mobile-first ── */
* { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }

.page {
  min-height: calc(100dvh - 3.5rem);
  padding: 1rem 0.875rem calc(1.5rem + env(safe-area-inset-bottom));
  display: grid;
  gap: 1rem;
  align-content: start;
}

/* ── Header ── */
.hero-panel {
  background: rgba(17,17,17,0.97);
  border: 1px solid rgba(191,95,255,0.25);
  padding: 1.1rem;
  border-radius: 2px;
  display: grid;
  gap: 0.75rem;
}

.hero-text { display: grid; gap: 0.25rem; }

.eyebrow {
  color: var(--neon);
  font-family: 'Cormorant SC', serif;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  font-size: 0.7rem;
}

h1 {
  font-family: 'Cinzel', serif;
  font-size: clamp(1.5rem, 6vw, 2.2rem);
  color: #F0E6FF;
  margin: 0;
  line-height: 1.15;
}

.hero-text p { color: #B8A8CC; font-size: 0.88rem; margin: 0; }

.credit-pill {
  display: inline-flex;
  align-items: baseline;
  gap: 0.4rem;
  border: 1px solid rgba(191,95,255,0.4);
  background: var(--neon-faint);
  padding: 0.65rem 1rem;
  border-radius: 2px;
  align-self: start;
}
.credit-num {
  color: var(--neon);
  font-family: 'Cinzel', serif;
  font-size: 1.4rem;
  line-height: 1;
}
.credit-pill small {
  font-family: 'Cormorant Garamond', serif;
  color: #B8A8CC;
  font-size: 0.82rem;
}

/* ── Filtros con scroll horizontal ── */
.filters-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: 2px;
}
.filters-wrap::-webkit-scrollbar { display: none; }

.filters {
  display: flex;
  gap: 0.5rem;
  width: max-content;
}

.filter-btn {
  border: 1px solid rgba(191,95,255,0.22);
  background: transparent;
  color: #B8A8CC;
  padding: 0 1rem;
  height: 44px;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  cursor: pointer;
  font-family: 'Cormorant SC', serif;
  font-size: 0.82rem;
  touch-action: manipulation;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}
.filter-btn.active { border-color: var(--neon); color: var(--neon); background: var(--neon-faint); }
.filter-btn:active  { background: rgba(191,95,255,0.15); }

/* ── Tarjetas ── */
.grid { display: grid; gap: 0.875rem; }

.offer-card {
  background: rgba(25,10,40,0.7);
  border: 1px solid rgba(191,95,255,0.18);
  padding: 1.1rem;
  border-radius: 2px;
  display: grid;
  gap: 0.75rem;
}
.offer-card:active { border-color: rgba(191,95,255,0.45); background: rgba(35,10,55,0.8); }

.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.tier {
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-family: 'Cormorant SC', serif;
  font-size: 0.72rem;
}
.tier-tentador  { color: #9B8AB0; }
.tier-atrevido  { color: var(--neon); }
.tier-sin-limite { color: #FF6B6B; }

.vendor { color: #F0E6FF; font-size: 0.88rem; font-weight: 500; }

h2 { font-family: 'Cinzel', serif; font-size: 1.05rem; margin: 0; color: #F0E6FF; line-height: 1.3; }

.offer-card > p { color: #C8BAD8; font-size: 0.92rem; margin: 0; line-height: 1.65; }

.details-row {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.25rem;
}

.price {
  color: var(--neon);
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  white-space: nowrap;
}

/* ── Botones (touch-friendly) ── */
.btn-primary, .btn-insuficiente, .btn-ghost {
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.78rem;
  border-radius: 2px;
  touch-action: manipulation;
  cursor: pointer;
  width: 100%;
}

.btn-primary {
  background: var(--neon);
  color: #0A0010;
  border: none;
  font-weight: 700;
}
.btn-primary:active { opacity: 0.8; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-insuficiente {
  background: rgba(192,57,43,0.07);
  color: #FF7060;
  border: 1px solid rgba(192,57,43,0.4);
  cursor: not-allowed;
  font-size: 0.72rem;
}

.btn-ghost {
  background: transparent;
  color: var(--neon);
  border: 1px solid rgba(191,95,255,0.4);
  width: auto;
  padding: 0 1.25rem;
}
.btn-ghost:active { background: var(--neon-faint); }

/* ── Estados ── */
.loading-state {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: #9B8AB0;
  font-size: 0.9rem;
  padding: 2.5rem 0;
  justify-content: center;
}
.loading-dot { animation: blink 1.2s infinite; font-size: 1.5rem; color: var(--neon); }
.loading-dot:nth-child(2) { animation-delay: 0.2s; }
.loading-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes blink { 0%,80%,100% { opacity: 0.15; } 40% { opacity: 1; } }

.error-state {
  padding: 1.25rem;
  border: 1px solid rgba(192,57,43,0.3);
  background: rgba(192,57,43,0.05);
  border-radius: 2px;
  display: grid;
  gap: 0.75rem;
  text-align: center;
  color: #FF7060;
}

.empty-state {
  padding: 2.5rem 1rem;
  border: 1px solid rgba(191,95,255,0.12);
  border-radius: 2px;
  background: rgba(17,17,17,0.95);
  text-align: center;
  display: grid;
  gap: 0.5rem;
  color: #C8BAD8;
}
.empty-hint { color: #7B6A90; font-size: 0.85rem; }

/* ── Toasts ── */
.toast {
  padding: 0.85rem 1rem;
  border-radius: 2px;
  font-size: 0.88rem;
  line-height: 1.5;
  animation: fadeIn 0.25s ease;
}
.toast-ok    { background: rgba(111,207,151,0.08); border: 1px solid rgba(111,207,151,0.3); color: #6fcf97; }
.toast-error { background: rgba(192,57,43,0.06);   border: 1px solid rgba(192,57,43,0.3);   color: #FF7060; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }

/* ── Tablet+ ── */
@media (min-width: 480px) {
  .page { padding: 1.25rem 1.25rem calc(2rem + env(safe-area-inset-bottom)); gap: 1.1rem; }
  .hero-panel { padding: 1.4rem; grid-template-columns: 1fr auto; align-items: start; }
  .details-row { grid-template-columns: auto 1fr; }
  .btn-primary, .btn-insuficiente { font-size: 0.8rem; }
  h2 { font-size: 1.1rem; }
}

@media (min-width: 768px) {
  .page { max-width: 700px; margin: 0 auto; }
  .offer-card { padding: 1.4rem; gap: 0.9rem; }
  .offer-card:hover { border-color: rgba(191,95,255,0.45); background: rgba(35,10,55,0.8); }
  .filter-btn:hover { border-color: var(--neon); color: var(--neon); background: var(--neon-faint); }
  .btn-primary:hover { box-shadow: 0 0 14px var(--neon-glow); }
}

/* ── Overlay reclamo ── */
.reclamo-overlay {
  position: fixed; inset: 0; z-index: 300;
  background: rgba(5,0,15,0.97);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  padding-bottom: calc(1rem + env(safe-area-inset-bottom));
  animation: fadeIn 0.2s ease;
}

.reclamo-card {
  display: grid;
  gap: 1.25rem;
  text-align: center;
  padding: 2rem 1.5rem;
  width: 100%;
  max-width: 420px;
  border: 1px solid rgba(191,95,255,0.5);
  background: rgba(18,5,32,0.99);
  border-radius: 2px;
  box-shadow: 0 0 50px rgba(191,95,255,0.18);
  animation: scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1);
}

.reclamo-orb {
  font-size: 3rem; color: var(--neon);
  animation: pulseNeon 2s ease infinite;
  line-height: 1;
}

.reclamo-sello {
  font-family: 'Cormorant SC', serif;
  letter-spacing: 0.28em; text-transform: uppercase;
  font-size: 0.72rem; color: var(--neon); margin: 0;
}

.reclamo-titulo {
  font-family: 'Cinzel', serif;
  font-size: clamp(1.25rem, 5vw, 1.8rem);
  color: #F0E6FF; margin: 0; line-height: 1.2;
}

.reclamo-vendedor { color: #C8BAD8; margin: 0; font-size: 0.95rem; }
.reclamo-vendedor strong { color: var(--neon); }

.reclamo-cta {
  display: flex; align-items: center;
  justify-content: center; gap: 0.75rem;
  background: rgba(191,95,255,0.1);
  border: 2px solid var(--neon);
  padding: 1rem 1rem;
  border-radius: 2px;
  box-shadow: 0 0 16px rgba(191,95,255,0.12);
}

.reclamo-accion {
  font-family: 'Cinzel', serif;
  font-size: clamp(0.95rem, 4vw, 1.35rem);
  color: #F0E6FF;
  letter-spacing: 0.05em;
  margin: 0; line-height: 1.3;
}

.reclamo-flecha {
  font-size: 1.3rem; color: var(--neon);
  animation: bounce 1s ease infinite;
  flex-shrink: 0;
}

.reclamo-hint { color: #9B8AB0; font-size: 0.85rem; font-style: italic; margin: 0; line-height: 1.5; }

.reclamo-cerrar {
  background: var(--neon); color: #0A0010;
  border: none;
  height: 50px;
  font-family: 'Cinzel', serif; text-transform: uppercase;
  letter-spacing: 0.15em; cursor: pointer;
  font-size: 0.88rem; font-weight: 700;
  touch-action: manipulation;
  border-radius: 2px;
}
.reclamo-cerrar:active { opacity: 0.85; }

@keyframes scaleIn  { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes pulseNeon { 0%,100% { opacity: 0.85; } 50% { opacity: 1; text-shadow: 0 0 25px var(--neon-glow); } }
@keyframes bounce    { 0%,100% { transform: translateY(0); } 50% { transform: translateY(5px); } }
  `]
})
export class CatalogoComponent implements OnInit {
  usuario: UsuarioLocal | null = null;
  ofertas: Oferta[] = [];
  selectedCategoria: 'todos' | 'tentador' | 'atrevido' | 'sin-limite' = 'todos';
  cargando    = signal(false);
  errorMsg    = signal('');
  procesandoId    = signal('');
  tratoOk         = signal('');
  tratoError      = signal('');
  tratoConfirmado = signal<Oferta | null>(null);

  readonly categorias = [
    { label: 'Todos',       value: 'todos'      },
    { label: 'Tentador',    value: 'tentador'   },
    { label: 'Atrevido',    value: 'atrevido'   },
    { label: 'Sin límites', value: 'sin-limite' },
  ] as const;

  constructor(private juego: JuegoService, private api: ApiService) {}

  ngOnInit(): void {
    this.usuario = this.juego.getUsuarioActual();
    this.cargarOfertas();
    this.api.getMe().subscribe({
      next: (u) => { this.juego.guardarUsuario(u); this.usuario = u; },
    });
  }

  cargarOfertas(): void {
    this.cargando.set(true);
    this.errorMsg.set('');
    this.api.getOfertas().subscribe({
      next: (o) => { this.ofertas = o; this.cargando.set(false); },
      error: () => {
        this.ofertas = [];
        this.cargando.set(false);
        this.errorMsg.set('No se pudo conectar con el servidor.');
      },
    });
  }

  get filteredOfertas(): Oferta[] {
    if (this.selectedCategoria === 'todos') return this.ofertas;
    return this.ofertas.filter(o => o.categoria === this.selectedCategoria);
  }

  setCategoria(value: 'todos' | 'tentador' | 'atrevido' | 'sin-limite'): void {
    this.selectedCategoria = value;
  }

  cerrarReclamo(): void {
    this.tratoConfirmado.set(null);
  }

  interesado(oferta: Oferta): void {
    if (this.procesandoId()) return;
    this.procesandoId.set(oferta.id);
    this.tratoOk.set('');
    this.tratoError.set('');

    this.api.confirmarTrato(oferta.id).subscribe({
      next: ({ comprador_creditos }) => {
        const u = this.juego.getUsuarioActual();
        if (u) { const updated = { ...u, creditos: comprador_creditos }; this.juego.guardarUsuario(updated); this.usuario = updated; }
        this.procesandoId.set('');
        this.tratoConfirmado.set(oferta);
        this.cargarOfertas();
      },
      error: (err) => {
        this.procesandoId.set('');
        const msg = (err.error as { error?: string })?.error;
        this.tratoError.set(msg ?? 'No se pudo completar el trato.');
        setTimeout(() => this.tratoError.set(''), 4000);
      },
    });
  }
}
