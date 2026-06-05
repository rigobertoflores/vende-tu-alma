import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { JuegoService, Oferta, UsuarioLocal } from '../services/juego.service';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<section class="page">

  <!-- ── Login PIN ── -->
  <div class="panel" *ngIf="!authenticated">
    <span class="eyebrow">Panel</span>
    <h1>Administrador</h1>
    <p class="sub">Ingresa el PIN para gestionar la noche.</p>
    <form (ngSubmit)="loginAdmin()">
      <input class="field-input" name="pin" [(ngModel)]="pin" type="password" placeholder="PIN de administrador" />
      <p class="error-msg" *ngIf="pinError">{{ pinError }}</p>
      <button class="btn-primary w-full" type="submit">Entrar</button>
    </form>
  </div>

  <ng-container *ngIf="authenticated">

    <!-- ── Header ── -->
    <div class="panel header-panel">
      <div>
        <span class="eyebrow">Administrador</span>
        <h1>Gestión de la noche</h1>
      </div>
      <button class="btn-danger" (click)="cerrarNoche()">Cerrar noche</button>
    </div>

    <!-- ── Error de conexión ── -->
    @if (loadError()) {
      <div class="panel error-panel">
        <p class="error-msg">{{ loadError() }}</p>
        <button class="btn-primary" (click)="refreshFromApi()" [disabled]="loadingData()">
          {{ loadingData() ? 'Cargando...' : 'Reintentar' }}
        </button>
      </div>
    }

    <!-- ── Cargando ── -->
    @if (loadingData() && !loadError()) {
      <div class="panel">
        <p class="empty">Cargando datos...</p>
      </div>
    }

    <!-- ── Crear usuario ── -->
    <div class="panel">
      <h2>Crear usuario</h2>
      <form class="crear-form" (ngSubmit)="crearUsuario()">
        <div class="form-row">
          <label class="field-label">
            Apodo
            <input class="field-input" name="nuApodo" [(ngModel)]="nuevoUsuario.apodo"
              maxlength="20" placeholder="Apodo único" />
          </label>
          <label class="field-label">
            Contraseña
            <input class="field-input" name="nuPass" [(ngModel)]="nuevoUsuario.password"
              type="password" placeholder="Contraseña" />
          </label>
        </div>

        <label class="field-label">
          Tipo
          <select class="field-input" name="nuTipo" [(ngModel)]="nuevoUsuario.tipo">
            <option value="unicornio">Unicornio</option>
            <option value="pareja">Pareja</option>
          </select>
        </label>

        <label class="field-label" *ngIf="nuevoUsuario.tipo === 'pareja'">
          Pareja de (apodo del otro usuario)
          <input class="field-input" name="nuParejaDe" [(ngModel)]="nuevoUsuario.pareja_de"
            maxlength="20" placeholder="Apodo de su pareja" />
        </label>

        <p class="error-msg" *ngIf="crearError()">{{ crearError() }}</p>
        <p class="ok-msg" *ngIf="crearOk()">{{ crearOk() }}</p>

        <button class="btn-primary w-full" type="submit" [disabled]="crearLoading()">
          {{ crearLoading() ? 'Creando...' : 'Crear usuario' }}
        </button>
      </form>
    </div>

    <!-- ── Usuarios activos ── -->
    <div class="panel">
      <h2>Usuarios registrados</h2>
      <p class="empty" *ngIf="!usuarios.length">No hay usuarios aún.</p>
      <div class="user-list">
        <div class="user-row" *ngFor="let u of usuarios">
          <div class="user-info">
            <span class="user-badge" [class.badge-pareja]="u.tipo === 'pareja'">{{ u.tipo }}</span>
            <span class="user-apodo">{{ u.apodo }}</span>
            <span class="user-pass">🔑 {{ u.password_plain }}</span>
            <span class="user-pareja" *ngIf="u.pareja_de">↔ {{ u.pareja_de }}</span>
          </div>
          <span class="user-creditos">{{ u.creditos }} cr</span>
        </div>
      </div>
    </div>

    <!-- ── Ofertas pendientes ── -->
    <div class="panel">
      <h2>Ofertas pendientes de aprobación</h2>
      <p class="empty" *ngIf="!pendingOfertas.length">No hay ofertas pendientes.</p>
      <div class="oferta-row" *ngFor="let o of pendingOfertas">
        <div>
          <strong>{{ o.titulo }}</strong>
          <p>{{ o.vendedor_apodo }} · {{ o.categoria }}</p>
        </div>
        <div class="oferta-controls">
          <input class="field-input narrow" type="number" min="1"
            [(ngModel)]="ponderaciones[o.id]" placeholder="Créditos" />
          <button class="btn-primary" (click)="aprobar(o)">Aprobar</button>
        </div>
      </div>
    </div>

    <!-- ── Todas las ofertas ── -->
    <div class="panel">
      <h2>Todas las ofertas</h2>
      <p class="empty" *ngIf="!todasOfertas.length">No hay ofertas.</p>
      <div class="oferta-row" *ngFor="let o of todasOfertas">
        <div>
          <strong>{{ o.titulo }}</strong>
          <p>{{ o.vendedor_apodo }} · {{ o.ponderacion ?? 'sin ponderar' }} cr</p>
        </div>
        <button class="btn-ghost" (click)="toggleOferta(o)">
          {{ o.disponible ? 'Desactivar' : 'Activar' }}
        </button>
      </div>
    </div>

  </ng-container>
</section>
  `,
  styles: [`
.page {
  min-height: calc(100dvh - 3.5rem);
  padding: 1.25rem 1rem 2rem;
  display: grid;
  gap: 1rem;
  align-content: start;
}

.panel {
  background: rgba(17,17,17,0.95);
  border: 1px solid var(--border);
  border-radius: 2px;
  padding: 1.25rem;
  display: grid;
  gap: 1rem;
}

.header-panel {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.eyebrow {
  display: block;
  font-family: 'Cormorant SC', serif;
  color: var(--gold);
  letter-spacing: 0.25em;
  text-transform: uppercase;
  font-size: 0.7rem;
  margin-bottom: 0.4rem;
}

h1 { font-family: 'Cinzel', serif; font-size: clamp(1.6rem, 4vw, 2.4rem); margin: 0; }
h2 { font-family: 'Cinzel', serif; font-size: 1.1rem; margin: 0; }

.sub { color: var(--text-secondary); font-size: 0.9rem; margin: 0; }

.field-label {
  display: grid;
  gap: 0.4rem;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.field-input {
  width: 100%;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border);
  padding: 0.8rem 0.9rem;
  color: var(--text-primary);
  border-radius: 2px;
  font: inherit;
}
.field-input:focus { border-color: var(--gold); outline: none; }
.field-input.narrow { width: 7rem; }

.crear-form { display: grid; gap: 0.9rem; }

.form-row {
  display: grid;
  gap: 0.75rem;
}
@media (min-width: 480px) {
  .form-row { grid-template-columns: 1fr 1fr; }
}

.btn-primary {
  background: var(--gold);
  color: var(--obsidian);
  border: none;
  padding: 0.85rem 1rem;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  cursor: pointer;
  font-size: 0.82rem;
}
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.w-full { width: 100%; }

.btn-ghost {
  background: transparent;
  color: var(--gold);
  border: 1px solid var(--border);
  padding: 0.65rem 1rem;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  font-size: 0.78rem;
  text-transform: uppercase;
  white-space: nowrap;
}

.btn-danger {
  background: transparent;
  color: var(--crimson-bright);
  border: 1px solid rgba(192,57,43,0.5);
  padding: 0.65rem 1rem;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  font-size: 0.78rem;
  text-transform: uppercase;
  white-space: nowrap;
}

.error-msg {
  color: var(--crimson-bright);
  font-size: 0.85rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(192,57,43,0.3);
  background: rgba(192,57,43,0.05);
  border-radius: 2px;
}

.ok-msg {
  color: #6fcf97;
  font-size: 0.85rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(111,207,151,0.3);
  background: rgba(111,207,151,0.05);
  border-radius: 2px;
}

/* ── Usuarios ── */
.user-list { display: grid; gap: 0.5rem; }

.user-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-top: 1px solid var(--border);
  gap: 1rem;
  flex-wrap: wrap;
}

.user-info { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }

.user-apodo { font-family: 'Cinzel', serif; font-size: 0.9rem; }

.user-badge {
  font-family: 'Cormorant SC', serif;
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 0.2rem 0.55rem;
  border: 1px solid var(--border);
  color: var(--text-secondary);
}
.badge-pareja { border-color: var(--gold-dim); color: var(--gold); }

.user-pass {
  font-family: 'Courier New', monospace;
  font-size: 0.82rem;
  color: var(--text-secondary);
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border);
  padding: 0.15rem 0.5rem;
  border-radius: 2px;
  letter-spacing: 0.05em;
}

.user-pareja { color: var(--text-muted); font-size: 0.8rem; }
.user-creditos { font-family: 'Cinzel', serif; color: var(--gold); white-space: nowrap; }

/* ── Ofertas ── */
.oferta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-top: 1px solid var(--border);
  gap: 1rem;
  flex-wrap: wrap;
}

.oferta-row p { color: var(--text-secondary); font-size: 0.85rem; margin: 0.2rem 0 0; }

.oferta-controls { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }

.empty { color: var(--text-muted); font-size: 0.9rem; }

.error-panel { display: grid; gap: 0.75rem; }
  `]
})
export class AdminComponent implements OnInit {
  pin = '';
  pinError = '';
  authenticated = false;

  nuevoUsuario = { apodo: '', password: '', tipo: 'unicornio', pareja_de: '' };
  crearLoading = signal(false);
  crearError = signal('');
  crearOk = signal('');

  usuarios: UsuarioLocal[] = [];
  pendingOfertas: Oferta[] = [];
  todasOfertas: Oferta[] = [];
  ponderaciones: Record<string, number> = {};
  loadingData = signal(false);
  loadError = signal('');

  constructor(
    private juego: JuegoService,
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  loginAdmin(): void {
    if (this.pin.trim() !== '6969') {
      this.pinError = 'PIN incorrecto';
      return;
    }
    this.pinError = '';
    this.authenticated = true;
    this.refreshFromApi();
  }

  refreshFromApi(): void {
    this.loadingData.set(true);
    this.loadError.set('');

    let done = 0;
    const checkDone = () => { if (++done === 2) this.loadingData.set(false); };

    this.api.getUsuariosAdmin('6969').subscribe({
      next: (u) => { this.usuarios = u; checkDone(); },
      error: () => {
        this.usuarios = [];
        this.loadError.set('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');
        checkDone();
      },
    });
    this.api.getOfertasAdmin('6969').subscribe({
      next: (o) => {
        this.todasOfertas = o;
        this.pendingOfertas = o.filter((of) => of.ponderacion === null);
        checkDone();
      },
      error: () => {
        this.todasOfertas = [];
        this.pendingOfertas = [];
        checkDone();
      },
    });
  }

  crearUsuario(): void {
    const { apodo, password, tipo, pareja_de } = this.nuevoUsuario;
    if (!apodo.trim() || !password.trim()) {
      this.crearError.set('Apodo y contraseña son obligatorios');
      return;
    }

    this.crearLoading.set(true);
    this.crearError.set('');
    this.crearOk.set('');

    this.api
      .crearUsuario(
        { apodo: apodo.trim(), password: password.trim(), tipo, pareja_de: pareja_de.trim() || undefined },
        '6969'
      )
      .subscribe({
        next: (u) => {
          this.crearLoading.set(false);
          this.crearOk.set(`Usuario "${u.apodo}" creado correctamente`);
          this.nuevoUsuario = { apodo: '', password: '', tipo: 'unicornio', pareja_de: '' };
          this.refreshFromApi();
        },
        error: (err) => {
          this.crearLoading.set(false);
          this.crearError.set((err.error as { error?: string })?.error ?? 'Error al crear usuario');
        },
      });
  }

  aprobar(oferta: Oferta): void {
    const valor = this.ponderaciones[oferta.id] ?? 0;
    if (valor < 1) return;
    this.api.ponderarOferta(oferta.id, valor, '6969').subscribe({
      next: () => { this.ponderaciones[oferta.id] = 0; this.refreshFromApi(); },
    });
  }

  toggleOferta(oferta: Oferta): void {
    this.api.toggleOferta(oferta.id, !oferta.disponible, '6969').subscribe({
      next: () => this.refreshFromApi(),
    });
  }

  cerrarNoche(): void {
    if (!confirm('¿Cerrar la noche? Se eliminarán todos los datos.')) return;
    this.api.cerrarNoche('6969').subscribe({
      next: () => {
        this.juego.cerrarNoche();
        this.router.navigate(['/']);
      },
    });
  }
}
