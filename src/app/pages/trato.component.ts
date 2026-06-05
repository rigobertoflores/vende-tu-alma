import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { JuegoService, Oferta, UsuarioLocal } from '../services/juego.service';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-trato',
  standalone: true,
  imports: [CommonModule],
  template: `
<!-- Animación de transacción completada -->
<div class="tx-overlay" *ngIf="confirmado()">
  <div class="tx-card">
    <div class="tx-orb">♦</div>
    <p class="tx-label">Trato sellado</p>
    <p class="tx-sub">Los créditos han sido transferidos</p>
  </div>
</div>

<!-- Pantalla principal -->
<section class="page" *ngIf="!confirmado()">

  <!-- Oferta encontrada -->
  <div class="card" *ngIf="usuario && oferta; else noOffer">
    <span class="eyebrow">Confirmar trato</span>
    <h1>¿Llegaron a un acuerdo<br><em>en persona?</em></h1>

    <div class="summary">
      <div class="summary-row">
        <span class="label">Oferta</span>
        <strong>{{ oferta.titulo }}</strong>
      </div>
      <div class="summary-row">
        <span class="label">Vendedor</span>
        <strong>{{ oferta.vendedor_apodo }}</strong>
      </div>
      <div class="summary-row">
        <span class="label">Créditos</span>
        <strong class="price">{{ oferta.ponderacion }} cr</strong>
      </div>
    </div>

    <p class="note">Al confirmar, los créditos se descontarán de tu saldo y la oferta quedará completada.</p>

    <button class="btn-primary" [disabled]="cargando()" (click)="confirmarTrato()">
      {{ cargando() ? 'Procesando...' : 'Confirmar trato' }}
    </button>

    <p class="error-msg" *ngIf="error">{{ error }}</p>
  </div>

  <!-- Oferta no encontrada -->
  <ng-template #noOffer>
    <div class="card notice-card">
      <h2>Oferta no disponible</h2>
      <p>Esta oferta ya fue completada o no existe.</p>
      <button class="btn-primary" (click)="volverCatalogo()">Ir al catálogo</button>
    </div>
  </ng-template>

</section>
  `,
  styles: [
    `
.page {
  min-height: calc(100vh - 4rem);
  padding: 3rem 1.5rem 6rem;
  display: grid;
  place-items: center;
}

.card {
  width: min(620px, 100%);
  background: rgba(17, 17, 17, 0.96);
  border: 1px solid var(--border);
  padding: 2.5rem;
  border-radius: 2px;
  display: grid;
  gap: 1.5rem;
}

.eyebrow {
  color: var(--gold);
  font-family: 'Cormorant SC', serif;
  text-transform: uppercase;
  letter-spacing: 0.25em;
  font-size: 0.78rem;
}

h1,
h2 {
  font-family: 'Cinzel', serif;
  margin: 0;
}

/* ── Animación de trato confirmado ── */
.tx-overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(5,5,5,0.92);
  z-index: 200;
  animation: fadeIn 0.3s ease;
}

.tx-card {
  text-align: center;
  display: grid;
  gap: 1rem;
  animation: scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1);
}

.tx-orb {
  font-size: 4rem;
  color: var(--gold);
  animation: spin-glow 1.5s ease infinite;
  line-height: 1;
}

.tx-label {
  font-family: 'Cinzel', serif;
  font-size: 1.5rem;
  color: var(--gold);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin: 0;
}

.tx-sub {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.7); opacity: 0; }
  to   { transform: scale(1);   opacity: 1; }
}

@keyframes spin-glow {
  0%,100% { text-shadow: 0 0 10px rgba(201,168,76,0.4); transform: rotate(0deg); }
  50%      { text-shadow: 0 0 30px rgba(201,168,76,0.9); transform: rotate(180deg); }
}

/* ── Contenido principal ── */
.page {
  min-height: calc(100dvh - 3.5rem);
  padding: 1.5rem 1rem 2rem;
  display: grid;
  align-content: center;
}

.card {
  max-width: 520px;
  width: 100%;
  margin: 0 auto;
  background: rgba(17,17,17,0.96);
  border: 1px solid var(--border);
  border-radius: 2px;
  padding: 1.75rem 1.5rem;
  display: grid;
  gap: 1.25rem;
}

.eyebrow {
  color: var(--gold);
  font-family: 'Cormorant SC', serif;
  text-transform: uppercase;
  letter-spacing: 0.25em;
  font-size: 0.7rem;
}

h1 {
  font-family: 'Cinzel', serif;
  font-size: clamp(1.6rem, 5vw, 2.4rem);
  margin: 0;
  line-height: 1.1;
}

h1 em { font-style: italic; color: var(--gold); }

h2 {
  font-family: 'Cinzel', serif;
  font-size: 1.3rem;
  margin: 0;
}

.summary {
  display: grid;
  gap: 0.75rem;
  padding: 1.25rem;
  border: 1px solid var(--border);
  background: rgba(255,255,255,0.03);
  border-radius: 2px;
}

.summary-row { display: grid; gap: 0.2rem; }

.label {
  color: var(--text-secondary);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-family: 'Cormorant SC', serif;
}

.price {
  color: var(--gold);
  font-family: 'Cinzel', serif;
  font-size: 1.1rem;
}

.note {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.7;
}

.btn-primary {
  background: var(--gold);
  color: var(--obsidian);
  border: none;
  padding: 1rem;
  width: 100%;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-size: 0.9rem;
  transition: opacity 0.2s;
}
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.error-msg {
  color: var(--crimson-bright);
  font-size: 0.88rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(192,57,43,0.3);
  background: rgba(192,57,43,0.05);
  border-radius: 2px;
}

.notice-card {
  text-align: center;
}
    `
  ]
})
export class TratoComponent implements OnInit {
  oferta: Oferta | null = null;
  usuario: UsuarioLocal | null = null;
  error = '';
  confirmado = signal(false);
  cargando = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private juego: JuegoService,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.usuario = this.juego.getUsuarioActual();
    if (!this.usuario) {
      this.router.navigate(['/acceso']);
      return;
    }

    const offerId = this.route.snapshot.queryParamMap.get('offerId');
    if (!offerId) return;

    // Buscar la oferta directamente por ID
    this.api.getOferta(offerId).subscribe({
      next: (oferta) => (this.oferta = oferta),
      error: () => {
        this.error = 'Oferta no encontrada o ya no disponible.';
      },
    });
  }

  confirmarTrato(): void {
    if (!this.usuario || !this.oferta || this.cargando()) return;

    this.cargando.set(true);
    this.error = '';

    this.api.confirmarTrato(this.oferta.id).subscribe({
      next: ({ comprador_creditos }) => {
        const u = this.juego.getUsuarioActual();
        if (u) this.juego.guardarUsuario({ ...u, creditos: comprador_creditos });
        this.cargando.set(false);
        this.confirmado.set(true);
        setTimeout(() => this.router.navigate(['/catalogo']), 2000);
      },
      error: (err) => {
        this.cargando.set(false);
        const msg = (err.error as { error?: string })?.error;
        this.error = msg ?? 'No fue posible confirmar el trato.';
      },
    });
  }

  volverCatalogo(): void {
    this.router.navigate(['/catalogo']);
  }
}
