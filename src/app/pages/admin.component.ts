import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { JuegoService, Oferta, UsuarioLocal } from '../services/juego.service';
import { ApiService, Trato } from '../services/api.service';

const PIN = '6969';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
<section class="page">

  <!-- ── Login PIN ── -->
  @if (!authenticated) {
    <div class="panel">
      <span class="eyebrow">Panel</span>
      <h1>Administrador</h1>
      <p class="sub">Ingresa el PIN para gestionar la noche.</p>
      <form (ngSubmit)="loginAdmin()">
        <input class="field-input" name="pin" [(ngModel)]="pin" type="password" placeholder="PIN de administrador" />
        <p class="error-msg" *ngIf="pinError">{{ pinError }}</p>
        <button class="btn-primary w-full" type="submit">Entrar</button>
      </form>
    </div>
  }

  @if (authenticated) {

    <!-- ── Header ── -->
    <div class="panel header-panel">
      <div>
        <span class="eyebrow">Administrador</span>
        <h1>Gestión de la noche</h1>
      </div>
      <button class="btn-danger" (click)="cerrarNoche()">Cerrar noche</button>
    </div>

    @if (loadError()) {
      <div class="panel error-panel">
        <p class="error-msg">{{ loadError() }}</p>
        <button class="btn-primary" (click)="refreshFromApi()" [disabled]="loadingData()">
          {{ loadingData() ? 'Cargando...' : 'Reintentar' }}
        </button>
      </div>
    }
    @if (loadingData() && !loadError()) {
      <div class="panel"><p class="empty">Cargando datos...</p></div>
    }

    <!-- ── Crear usuario ── -->
    <div class="panel">
      <h2>Crear usuario</h2>
      <form class="crear-form" (ngSubmit)="crearUsuario()">
        <div class="form-row">
          <label class="field-label">Apodo
            <input class="field-input" name="nuApodo" [(ngModel)]="nuevoUsuario.apodo" maxlength="20" placeholder="Apodo único" />
          </label>
          <label class="field-label">Contraseña
            <input class="field-input" name="nuPass" [(ngModel)]="nuevoUsuario.password" type="password" placeholder="Contraseña" />
          </label>
        </div>
        <label class="field-label">Tipo
          <select class="field-input" name="nuTipo" [(ngModel)]="nuevoUsuario.tipo">
            <option value="unicornio">Unicornio</option>
            <option value="pareja">Pareja</option>
          </select>
        </label>
        @if (nuevoUsuario.tipo === 'pareja') {
          <label class="field-label">Pareja de (apodo)
            <input class="field-input" name="nuParejaDe" [(ngModel)]="nuevoUsuario.pareja_de" maxlength="20" placeholder="Apodo de su pareja" />
          </label>
        }
        <p class="error-msg" *ngIf="crearError()">{{ crearError() }}</p>
        <p class="ok-msg" *ngIf="crearOk()">{{ crearOk() }}</p>
        <button class="btn-primary w-full" type="submit" [disabled]="crearLoading()">
          {{ crearLoading() ? 'Creando...' : 'Crear usuario' }}
        </button>
      </form>
    </div>

    <!-- ── Usuarios registrados ── -->
    <div class="panel">
      <div class="panel-header">
        <h2>Usuarios registrados</h2>
        <div class="todos-creditos">
          <input class="field-input narrow" type="number" min="0" [(ngModel)]="creditosTodos" placeholder="Cr" />
          <button class="btn-ghost" (click)="asignarCreditosTodos()">Asignar a todos</button>
        </div>
      </div>
      <p class="empty" *ngIf="!usuarios.length">No hay usuarios aún.</p>
      <div class="user-list">
        @for (u of usuarios; track u.id) {
          <div class="user-row">
            <div class="user-info">
              <span class="user-badge" [class.badge-pareja]="u.tipo === 'pareja'">{{ u.tipo }}</span>
              <span class="user-apodo">{{ u.apodo }}</span>
              <span class="user-pass">🔑 {{ u.password_plain }}</span>
              @if (u.pareja_de) { <span class="user-pareja">↔ {{ u.pareja_de }}</span> }
            </div>
            <div class="user-actions">
              <input class="field-input narrow" type="number" min="0"
                [(ngModel)]="creditosEdicion[u.id]" [placeholder]="u.creditos + ' cr'" />
              <button class="btn-ghost sm" (click)="guardarCreditos(u)">Guardar</button>
              <span class="user-creditos">{{ u.creditos }} cr</span>
              <button class="btn-delete sm" (click)="eliminarUsuario(u)">✕</button>
            </div>
          </div>
        }
      </div>
    </div>

    <!-- ── Ofertas pendientes ── -->
    <div class="panel">
      <h2>Ofertas pendientes de aprobación</h2>
      <p class="empty" *ngIf="!pendingOfertas.length">No hay ofertas pendientes.</p>
      @for (o of pendingOfertas; track o.id) {
        <div class="oferta-row">
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
      }
    </div>

    <!-- ── Todas las ofertas ── -->
    <div class="panel">
      <div class="panel-header">
        <h2>Todas las ofertas</h2>
        <div class="bulk-btns">
          <button class="btn-ghost sm" (click)="toggleTodas(true)">Activar todas</button>
          <button class="btn-ghost sm" (click)="toggleTodas(false)">Desactivar todas</button>
        </div>
      </div>
      <p class="empty" *ngIf="!todasOfertas.length">No hay ofertas.</p>
      @for (o of todasOfertas; track o.id) {
        <div class="oferta-row oferta-expandible">
          @if (editandoOferta[o.id]) {
            <div class="oferta-edit-form">
              <input class="field-input" [(ngModel)]="editOfertas[o.id].titulo" placeholder="Título" />
              <textarea class="field-input" [(ngModel)]="editOfertas[o.id].descripcion" rows="2" placeholder="Descripción"></textarea>
              <div class="form-row">
                <select class="field-input" [(ngModel)]="editOfertas[o.id].categoria">
                  <option value="tentador">Tentador</option>
                  <option value="atrevido">Atrevido</option>
                  <option value="sin-limite">Sin límites</option>
                </select>
                <input class="field-input" type="number" min="1" [(ngModel)]="editOfertas[o.id].ponderacion" placeholder="Créditos" />
              </div>
              <div class="oferta-controls">
                <button class="btn-primary" (click)="guardarOferta(o)">Guardar</button>
                <button class="btn-ghost" (click)="cancelarEdit(o.id)">Cancelar</button>
              </div>
            </div>
          } @else {
            <div class="oferta-info">
              <strong>{{ o.titulo }}</strong>
              <p>{{ o.vendedor_apodo }} · {{ o.ponderacion ?? 'sin ponderar' }} cr
                <span class="estado-badge" [class.activa]="o.disponible">{{ o.disponible ? '● activa' : '○ inactiva' }}</span>
              </p>
            </div>
            <div class="oferta-controls">
              <button class="btn-ghost sm" (click)="iniciarEdit(o)">Editar</button>
              <button class="btn-ghost" (click)="toggleOferta(o)">
                {{ o.disponible ? 'Desactivar' : 'Activar' }}
              </button>
              <button class="btn-delete sm" (click)="eliminarOferta(o)">✕</button>
            </div>
          }
        </div>
      }
    </div>

    <!-- ── Transacciones ── -->
    <div class="panel">
      <h2>Transacciones</h2>
      <p class="empty" *ngIf="!tratos.length">No hay transacciones aún.</p>
      @for (t of tratos; track t.id) {
        <div class="trato-row">
          <div class="trato-info">
            <span class="trato-oferta">{{ t.oferta_titulo }}</span>
            <span class="trato-detalle">{{ t.comprador_apodo }} → {{ t.vendedor_apodo }}</span>
          </div>
          <div class="trato-right">
            <span class="trato-creditos">{{ t.creditos_transferidos }} cr</span>
            <span class="trato-fecha">{{ t.timestamp | date:'HH:mm' }}</span>
          </div>
        </div>
      }
    </div>

  }
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

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
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

.field-label { display: grid; gap: 0.4rem; color: var(--text-secondary); font-size: 0.85rem; }

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
.field-input.narrow { width: 6rem; padding: 0.6rem 0.7rem; }

textarea.field-input { min-height: 60px; resize: vertical; }

.crear-form { display: grid; gap: 0.9rem; }

.form-row { display: grid; gap: 0.75rem; }
@media (min-width: 480px) { .form-row { grid-template-columns: 1fr 1fr; } }

.btn-primary {
  background: var(--gold); color: var(--obsidian);
  border: none; padding: 0.85rem 1rem;
  font-family: 'Cinzel', serif; text-transform: uppercase;
  letter-spacing: 0.12em; cursor: pointer; font-size: 0.82rem;
}
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.w-full { width: 100%; }

.btn-ghost {
  background: transparent; color: var(--gold);
  border: 1px solid var(--border);
  padding: 0.65rem 1rem; cursor: pointer;
  font-family: 'Cinzel', serif; font-size: 0.78rem;
  text-transform: uppercase; white-space: nowrap;
}
.btn-ghost.sm { padding: 0.5rem 0.7rem; font-size: 0.72rem; }

.btn-danger {
  background: transparent; color: var(--crimson-bright);
  border: 1px solid rgba(192,57,43,0.5);
  padding: 0.65rem 1rem; cursor: pointer;
  font-family: 'Cinzel', serif; font-size: 0.78rem;
  text-transform: uppercase; white-space: nowrap;
}

.error-msg {
  color: var(--crimson-bright); font-size: 0.85rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(192,57,43,0.3);
  background: rgba(192,57,43,0.05); border-radius: 2px;
}
.ok-msg {
  color: #6fcf97; font-size: 0.85rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(111,207,151,0.3);
  background: rgba(111,207,151,0.05); border-radius: 2px;
}

/* ── Usuarios ── */
.user-list { display: grid; gap: 0.5rem; }
.user-row {
  display: flex; justify-content: space-between;
  align-items: center; padding: 0.75rem 0;
  border-top: 1px solid var(--border); gap: 1rem; flex-wrap: wrap;
}
.user-info { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; flex: 1; }
.user-actions { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.user-apodo { font-family: 'Cinzel', serif; font-size: 0.9rem; }
.user-badge {
  font-family: 'Cormorant SC', serif; font-size: 0.7rem;
  letter-spacing: 0.15em; text-transform: uppercase;
  padding: 0.2rem 0.55rem; border: 1px solid var(--border); color: var(--text-secondary);
}
.badge-pareja { border-color: var(--gold-dim); color: var(--gold); }
.user-pass {
  font-family: 'Courier New', monospace; font-size: 0.82rem;
  color: var(--text-secondary); background: rgba(255,255,255,0.04);
  border: 1px solid var(--border); padding: 0.15rem 0.5rem; border-radius: 2px;
}
.user-pareja { color: var(--text-muted); font-size: 0.8rem; }
.user-creditos { font-family: 'Cinzel', serif; color: var(--gold); white-space: nowrap; }

.todos-creditos { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
.bulk-btns { display: flex; gap: 0.5rem; flex-wrap: wrap; }

/* ── Ofertas ── */
.oferta-row {
  display: flex; justify-content: space-between;
  align-items: center; padding: 0.75rem 0;
  border-top: 1px solid var(--border); gap: 1rem; flex-wrap: wrap;
}
.oferta-info { flex: 1; }
.oferta-info strong { color: var(--text-primary); font-size: 0.95rem; }
.oferta-row p { color: var(--text-secondary); font-size: 0.85rem; margin: 0.2rem 0 0; }
.oferta-controls { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
.oferta-edit-form { display: grid; gap: 0.75rem; width: 100%; }
.estado-badge { margin-left: 0.5rem; font-size: 0.78rem; }
.estado-badge.activa { color: #6fcf97; }

/* ── Transacciones ── */
.trato-row {
  display: flex; justify-content: space-between;
  align-items: center; padding: 0.7rem 0;
  border-top: 1px solid var(--border); gap: 1rem; flex-wrap: wrap;
}
.trato-info { display: grid; gap: 0.15rem; flex: 1; }
.trato-oferta { color: var(--text-primary); font-size: 0.9rem; font-family: 'Cinzel', serif; }
.trato-detalle { color: var(--text-secondary); font-size: 0.82rem; }
.trato-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.15rem; }
.trato-creditos { color: var(--gold); font-family: 'Cinzel', serif; font-size: 0.9rem; }
.trato-fecha { color: var(--text-muted); font-size: 0.78rem; }

.btn-delete {
  background: transparent; color: var(--crimson-bright);
  border: 1px solid rgba(192,57,43,0.4);
  padding: 0.5rem 0.65rem; cursor: pointer;
  font-size: 0.8rem; line-height: 1;
}
.btn-delete:hover { background: rgba(192,57,43,0.1); }

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
  crearError   = signal('');
  crearOk      = signal('');

  usuarios: UsuarioLocal[] = [];
  pendingOfertas: Oferta[] = [];
  todasOfertas: Oferta[] = [];
  tratos: Trato[] = [];
  ponderaciones: Record<string, number> = {};
  creditosEdicion: Record<string, number> = {};
  creditosTodos: number | null = null;
  editandoOferta: Record<string, boolean> = {};
  editOfertas: Record<string, { titulo: string; descripcion: string; categoria: string; ponderacion: number | null }> = {};

  loadingData = signal(false);
  loadError   = signal('');

  constructor(
    private juego: JuegoService,
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  loginAdmin(): void {
    if (this.pin.trim() !== PIN) { this.pinError = 'PIN incorrecto'; return; }
    this.pinError = '';
    this.authenticated = true;
    this.refreshFromApi();
  }

  refreshFromApi(): void {
    this.loadingData.set(true);
    this.loadError.set('');
    let done = 0;
    const checkDone = () => { if (++done === 3) this.loadingData.set(false); };

    this.api.getUsuariosAdmin(PIN).subscribe({
      next: (u) => { this.usuarios = u; checkDone(); },
      error: () => {
        this.loadError.set('No se pudo conectar con el servidor.');
        checkDone();
      },
    });
    this.api.getOfertasAdmin(PIN).subscribe({
      next: (o) => {
        this.todasOfertas = o;
        this.pendingOfertas = o.filter(of => of.ponderacion === null);
        checkDone();
      },
      error: () => { checkDone(); },
    });
    this.api.getTratosAdmin(PIN).subscribe({
      next: (t) => { this.tratos = t; checkDone(); },
      error: () => { checkDone(); },
    });
  }

  crearUsuario(): void {
    const { apodo, password, tipo, pareja_de } = this.nuevoUsuario;
    if (!apodo.trim() || !password.trim()) { this.crearError.set('Apodo y contraseña son obligatorios'); return; }
    this.crearLoading.set(true); this.crearError.set(''); this.crearOk.set('');
    this.api.crearUsuario({ apodo: apodo.trim(), password: password.trim(), tipo, pareja_de: pareja_de.trim() || undefined }, PIN)
      .subscribe({
        next: (u) => {
          this.crearLoading.set(false);
          this.crearOk.set(`Usuario "${u.apodo}" creado`);
          this.nuevoUsuario = { apodo: '', password: '', tipo: 'unicornio', pareja_de: '' };
          this.refreshFromApi();
        },
        error: (err) => {
          this.crearLoading.set(false);
          this.crearError.set((err.error as { error?: string })?.error ?? 'Error al crear usuario');
        },
      });
  }

  guardarCreditos(u: UsuarioLocal): void {
    const val = this.creditosEdicion[u.id];
    if (val === undefined || val === null) return;
    this.api.editarCreditosUsuario(u.id, val, PIN).subscribe({
      next: () => { delete this.creditosEdicion[u.id]; this.refreshFromApi(); },
    });
  }

  asignarCreditosTodos(): void {
    if (this.creditosTodos === null || this.creditosTodos < 0) return;
    if (!confirm(`¿Asignar ${this.creditosTodos} créditos a TODOS los usuarios?`)) return;
    this.api.editarCreditosTodos(this.creditosTodos, PIN).subscribe({
      next: () => { this.creditosTodos = null; this.refreshFromApi(); },
    });
  }

  aprobar(oferta: Oferta): void {
    const valor = this.ponderaciones[oferta.id] ?? 0;
    if (valor < 1) return;
    this.api.ponderarOferta(oferta.id, valor, PIN).subscribe({
      next: () => { this.ponderaciones[oferta.id] = 0; this.refreshFromApi(); },
    });
  }

  iniciarEdit(o: Oferta): void {
    this.editOfertas[o.id] = { titulo: o.titulo, descripcion: o.descripcion, categoria: o.categoria, ponderacion: o.ponderacion };
    this.editandoOferta[o.id] = true;
  }

  cancelarEdit(id: string): void {
    this.editandoOferta[id] = false;
  }

  guardarOferta(o: Oferta): void {
    const data = this.editOfertas[o.id];
    this.api.editarOferta(o.id, data, PIN).subscribe({
      next: () => { this.editandoOferta[o.id] = false; this.refreshFromApi(); },
    });
  }

  toggleOferta(oferta: Oferta): void {
    this.api.toggleOferta(oferta.id, !oferta.disponible, PIN).subscribe({
      next: () => this.refreshFromApi(),
    });
  }

  toggleTodas(disponible: boolean): void {
    const msg = disponible ? '¿Activar TODAS las ofertas aprobadas?' : '¿Desactivar TODAS las ofertas?';
    if (!confirm(msg)) return;
    this.api.toggleTodasOfertas(disponible, PIN).subscribe({
      next: () => this.refreshFromApi(),
    });
  }

  eliminarUsuario(u: UsuarioLocal): void {
    if (!confirm(`¿Eliminar al usuario "${u.apodo}"?`)) return;
    this.api.eliminarUsuario(u.id, PIN).subscribe({
      next: () => this.refreshFromApi(),
    });
  }

  eliminarOferta(o: Oferta): void {
    if (!confirm(`¿Eliminar la oferta "${o.titulo}"?`)) return;
    this.api.eliminarOferta(o.id, PIN).subscribe({
      next: () => this.refreshFromApi(),
    });
  }

  cerrarNoche(): void {
    if (!confirm('¿Cerrar la noche? Se eliminarán todos los datos.')) return;
    this.api.cerrarNoche(PIN).subscribe({
      next: () => { this.juego.cerrarNoche(); this.router.navigate(['/']); },
    });
  }
}
