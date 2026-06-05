import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Oferta, UsuarioLocal } from '../services/juego.service';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-buscar',
  standalone: true,
  imports: [FormsModule],
  template: `
<section class="page buscar-page container-fluid py-4">
  <div class="row justify-content-center">
    <div class="col-12 col-sm-10 col-md-8 col-lg-7">
      <div class="search-panel card bg-transparent border-0 p-4">
        <span class="eyebrow">Buscar</span>
        <h1>Encuentra tu próximo trato</h1>
        <form class="search-form" (ngSubmit)="buscar()">
          <input class="form-control" name="query" [(ngModel)]="consulta"
            placeholder="Busca por apodo" autocomplete="off" />
          <button class="btn btn-primary w-100" type="submit">Buscar</button>
        </form>
      </div>

      @if (esPropioYPareja) {
        <div class="notice-panel notice-warn">
          <span class="notice-icon">✕</span>
          <p>No puedes comprarle a tu propia cuenta ni a tu pareja registrada.</p>
        </div>
      }

      @if (busquedaRealizada && !usuarioBuscado && !esPropioYPareja) {
        <div class="notice-panel notice-info">
          <p>No se encontró ningún usuario con ese apodo.</p>
        </div>
      }

      @if (usuarioBuscado && !esPropioYPareja) {
        <div class="profile-card">
          <div class="profile-header">
            <div>
              <span class="badge">{{ usuarioBuscado.tipo }}</span>
              <h2>{{ usuarioBuscado.apodo }}</h2>
            </div>
            <span class="credit-chip">{{ usuarioBuscado.creditos }} cr</span>
          </div>
          <div class="offer-grid">
            @for (oferta of ofertasUsuario; track oferta.id) {
              <article class="offer-card">
                <h3>{{ oferta.titulo }}</h3>
                <p>{{ oferta.descripcion }}</p>
                <div class="offer-meta">
                  <span>{{ oferta.categoria }}</span>
                  <span>{{ oferta.ponderacion === null ? 'Pendiente' : oferta.ponderacion + ' cr' }}</span>
                </div>
                <button class="btn-primary" (click)="proponerTrato(oferta)">Proponer trato</button>
              </article>
            }
          </div>
          @if (!ofertasUsuario.length) {
            <p class="empty-state">Este usuario no tiene ofertas activas aún.</p>
          }
        </div>
      }

      @if (!busquedaRealizada && !esPropioYPareja) {
        <div class="notice-panel notice-info">
          <p>Escribe un apodo para encontrar al vendedor que te interesa.</p>
        </div>
      }
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
  gap: 1.5rem;
}

.search-panel,
.profile-card,
.notice-panel {
  background: rgba(17, 17, 17, 0.95);
  border: 1px solid var(--border);
  padding: 2rem;
  border-radius: 2px;
}

.eyebrow {
  color: var(--gold);
  text-transform: uppercase;
  letter-spacing: 0.3em;
  font-family: 'Cormorant SC', serif;
  font-size: 0.75rem;
  display: inline-block;
  margin-bottom: 1rem;
}

h1,
h2 {
  font-family: 'Cinzel', serif;
  margin: 0;
}

.search-form {
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
}

input {
  width: 100%;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
  border: 1px solid var(--border);
  padding: 1rem 1.1rem;
  border-radius: 2px;
}

.btn-primary {
  background: var(--gold);
  color: var(--obsidian);
  border: none;
  padding: 0.95rem 1rem;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-family: 'Cinzel', serif;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
}

.badge {
  display: inline-flex;
  padding: 0.35rem 0.9rem;
  border: 1px solid var(--border);
  color: var(--gold);
  text-transform: uppercase;
  font-family: 'Cormorant SC', serif;
  letter-spacing: 0.2em;
  font-size: 0.75rem;
}

.credit-chip {
  background: rgba(201, 168, 76, 0.08);
  border: 1px solid var(--border);
  padding: 0.6rem 1rem;
  font-family: 'Cinzel', serif;
}

.offer-grid {
  display: grid;
  gap: 1rem;
}

.offer-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  padding: 1.25rem;
  border-radius: 2px;
  display: grid;
  gap: 1rem;
}

.offer-meta {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.empty-state {
  color: var(--text-muted);
  margin-top: 0.75rem;
}

.notice-warn {
  border-color: rgba(192,57,43,0.4);
  background: rgba(192,57,43,0.06);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.notice-warn p { color: var(--crimson-bright); margin: 0; }

.notice-icon {
  font-size: 1.1rem;
  color: var(--crimson-bright);
  flex-shrink: 0;
}

.notice-info { color: var(--text-muted); }

@media (max-width: 720px) {
  .page {
    padding: 2rem 1rem 5rem;
  }

  .profile-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .offer-meta {
    flex-direction: column;
    align-items: flex-start;
  }

  .btn-primary {
    width: 100%;
  }
}
    `
  ]
})
export class BuscarComponent implements OnInit {
  consulta = '';
  usuarioBuscado: UsuarioLocal | null = null;
  ofertasUsuario: Oferta[] = [];
  esPropioYPareja = false;
  busquedaRealizada = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    const query = this.route.snapshot.queryParamMap.get('q');
    if (query) {
      this.consulta = query;
      this.buscar();
    }
  }

  buscar(): void {
    const termino = this.consulta.trim();
    if (!termino) {
      this.usuarioBuscado = null;
      this.ofertasUsuario = [];
      this.esPropioYPareja = false;
      this.busquedaRealizada = false;
      return;
    }

    this.usuarioBuscado = null;
    this.ofertasUsuario = [];
    this.esPropioYPareja = false;
    this.busquedaRealizada = true;

    this.api.buscarUsuario(termino).subscribe({
      next: (usuario) => {
        this.usuarioBuscado = usuario;
        this.api.getOfertasVendedor(usuario.id).subscribe({
          next: (o) => (this.ofertasUsuario = o),
        });
      },
      error: (err) => {
        if (err.status === 403) this.esPropioYPareja = true;
      },
    });
  }

  proponerTrato(oferta: Oferta): void {
    this.router.navigate(['/trato'], { queryParams: { offerId: oferta.id } });
  }
}
