import { Component, OnDestroy, OnInit } from '@angular/core';
import { UsuarioLocal } from '../services/juego.service';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-marcador',
  standalone: true,
  imports: [],
  template: `
<section class="page">
  <header class="hero-panel">
    <span class="eyebrow">Marcador</span>
    <h1>Ranking de la noche</h1>
    <p class="subtitle">Los créditos se actualizan cada 10 segundos.</p>
  </header>

  @if (ranking.length > 0) {
    <div class="top-three">
      @for (jugador of ranking.slice(0, 3); track jugador.id; let i = $index) {
        <article class="top-card" [class.rank-1]="i === 0" [class.rank-2]="i === 1" [class.rank-3]="i === 2">
          <span class="position">#{{ i + 1 }}</span>
          <div class="player-info">
            <h2>{{ jugador.apodo }}</h2>
            <p class="tipo">{{ jugador.tipo }}</p>
          </div>
          <span class="points">{{ jugador.creditos }}<small> cr</small></span>
        </article>
      }
    </div>

    <div class="list-panel">
      <div class="list-header">
        <span>#</span>
        <span>Apodo</span>
        <span>Créditos</span>
      </div>
      @for (jugador of ranking; track jugador.id; let index = $index) {
        <div class="list-row">
          <span class="row-pos">{{ index + 1 }}</span>
          <div class="row-main">
            <span class="row-name">{{ jugador.apodo }}</span>
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="porcentaje(jugador.creditos)"></div>
            </div>
          </div>
          <span class="row-cr">{{ jugador.creditos }} cr</span>
        </div>
      }
    </div>
  } @else {
    <div class="empty-panel">
      <p>Aún no hay jugadores activos esta noche.</p>
    </div>
  }
</section>
  `,
  styles: [
    `
.page {
  min-height: calc(100dvh - 3.5rem);
  padding: 1.5rem 1rem 2rem;
  display: grid;
  gap: 1.25rem;
  align-content: start;
}

.hero-panel {
  background: rgba(17, 17, 17, 0.95);
  border: 1px solid var(--border);
  padding: 1.5rem;
  border-radius: 2px;
}

.eyebrow {
  display: inline-block;
  color: var(--gold);
  text-transform: uppercase;
  letter-spacing: 0.28em;
  font-family: 'Cormorant SC', serif;
  font-size: 0.7rem;
  margin-bottom: 0.6rem;
}

h1 {
  font-family: 'Cinzel', serif;
  font-size: clamp(1.6rem, 5vw, 2.6rem);
  margin: 0 0 0.4rem;
  line-height: 1.1;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0;
}

/* ── Top 3 ── */
.top-three {
  display: grid;
  gap: 0.75rem;
}

.top-card {
  display: grid;
  grid-template-columns: 3rem 1fr auto;
  gap: 0.75rem;
  align-items: center;
  padding: 1rem 1.25rem;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.03);
  border-radius: 2px;
}

.top-card.rank-1 {
  border-color: var(--gold);
  background: rgba(201, 168, 76, 0.07);
}

.top-card.rank-2 { border-color: rgba(201, 168, 76, 0.6); }
.top-card.rank-3 { border-color: rgba(201, 168, 76, 0.35); }

.position {
  font-family: 'Cinzel', serif;
  font-size: 1.5rem;
  color: var(--gold);
  line-height: 1;
}

.player-info h2 {
  font-family: 'Cinzel', serif;
  font-size: 0.95rem;
  margin: 0 0 0.2rem;
}

.tipo {
  color: var(--text-secondary);
  font-size: 0.8rem;
  text-transform: capitalize;
  margin: 0;
}

.points {
  font-family: 'Cinzel', serif;
  font-size: 1.1rem;
  color: var(--gold);
  text-align: right;
  white-space: nowrap;
}

.points small {
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-family: 'Cormorant SC', serif;
}

/* ── Full list ── */
.list-panel {
  background: rgba(17, 17, 17, 0.95);
  border: 1px solid var(--border);
  border-radius: 2px;
  overflow: hidden;
}

.list-header,
.list-row {
  display: grid;
  grid-template-columns: 2rem 1fr auto;
  gap: 0.75rem;
  padding: 0.8rem 1.25rem;
  align-items: center;
}

.list-header { align-items: end; }

.list-header {
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-family: 'Cormorant SC', serif;
  font-size: 0.75rem;
}

.list-row {
  color: var(--text-primary);
  font-size: 0.95rem;
}

.list-row:nth-child(even) {
  background: rgba(255, 255, 255, 0.03);
}

.row-pos {
  color: var(--text-muted);
  font-family: 'Cinzel', serif;
}

.row-cr {
  color: var(--gold);
  font-family: 'Cinzel', serif;
  font-size: 0.85rem;
  white-space: nowrap;
}

.row-main {
  flex: 1;
  display: grid;
  gap: 0.3rem;
  min-width: 0;
}

.progress-bar {
  height: 3px;
  background: rgba(201,168,76,0.12);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gold-dim), var(--gold));
  border-radius: 2px;
  transition: width 0.6s ease;
}

.empty-panel {
  padding: 2rem 1.5rem;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: rgba(17, 17, 17, 0.95);
  text-align: center;
  color: var(--text-muted);
}

@media (min-width: 480px) {
  .page {
    padding: 2rem 1.5rem 2rem;
  }

  .top-card {
    grid-template-columns: 3.5rem 1fr auto;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
  }

  .position {
    font-size: 1.8rem;
  }

  .player-info h2 {
    font-size: 1.1rem;
  }
}
    `
  ]
})
export class MarcadorComponent implements OnInit, OnDestroy {
  ranking: UsuarioLocal[] = [];
  private intervalId = 0;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.refreshRanking();
    this.intervalId = window.setInterval(() => this.refreshRanking(), 10000);
  }

  ngOnDestroy(): void {
    window.clearInterval(this.intervalId);
  }

  refreshRanking(): void {
    this.api.getMarcador().subscribe({
      next: (lista) => (this.ranking = lista),
    });
  }

  porcentaje(creditos: number): number {
    const lider = this.ranking[0]?.creditos ?? 1;
    return lider === 0 ? 0 : Math.round((creditos / lider) * 100);
  }
}
