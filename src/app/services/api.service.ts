import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UsuarioLocal, Oferta } from './juego.service';

const BASE = 'https://vende-tu-alma-production.up.railway.app/api';
const TOKEN_KEY = 'vta_token';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  // ── Token ──────────────────────────────────────────
  getToken(): string | null { return localStorage.getItem(TOKEN_KEY); }
  setToken(token: string): void { localStorage.setItem(TOKEN_KEY, token); }
  clearToken(): void { localStorage.removeItem(TOKEN_KEY); }

  private authHeaders(): HttpHeaders {
    const t = this.getToken();
    return t ? new HttpHeaders({ Authorization: `Bearer ${t}` }) : new HttpHeaders();
  }

  private adminHeaders(pin: string): HttpHeaders {
    return new HttpHeaders({ 'x-admin-pin': pin });
  }

  // ── Auth ───────────────────────────────────────────
  login(apodo: string, password: string): Observable<{ usuario: UsuarioLocal; token: string }> {
    return this.http.post<{ usuario: UsuarioLocal; token: string }>(
      `${BASE}/auth/login`, { apodo, password }
    );
  }

  // ── Usuarios ───────────────────────────────────────
  getMe(): Observable<UsuarioLocal> {
    return this.http.get<UsuarioLocal>(`${BASE}/usuarios/me`, { headers: this.authHeaders() });
  }

  buscarUsuario(q: string): Observable<UsuarioLocal> {
    return this.http.get<UsuarioLocal>(`${BASE}/usuarios/buscar`, {
      params: { q }, headers: this.authHeaders(),
    });
  }

  getMarcador(): Observable<UsuarioLocal[]> {
    return this.http.get<UsuarioLocal[]>(`${BASE}/usuarios/marcador`, { headers: this.authHeaders() });
  }

  // ── Ofertas ────────────────────────────────────────
  getOfertas(): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(`${BASE}/ofertas`, { headers: this.authHeaders() });
  }

  getOferta(id: string): Observable<Oferta> {
    return this.http.get<Oferta>(`${BASE}/ofertas/${id}`, { headers: this.authHeaders() });
  }

  getMisOfertas(): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(`${BASE}/ofertas/mias`, { headers: this.authHeaders() });
  }

  getOfertasVendedor(id: string): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(`${BASE}/ofertas/vendedor/${id}`, { headers: this.authHeaders() });
  }

  crearOferta(data: { titulo: string; descripcion: string; categoria: string }): Observable<Oferta> {
    return this.http.post<Oferta>(`${BASE}/ofertas`, data, { headers: this.authHeaders() });
  }

  // ── Tratos ─────────────────────────────────────────
  confirmarTrato(oferta_id: string): Observable<{ comprador_creditos: number; vendedor_creditos: number }> {
    return this.http.post<{ comprador_creditos: number; vendedor_creditos: number }>(
      `${BASE}/tratos`, { oferta_id }, { headers: this.authHeaders() }
    );
  }

  // ── Admin ──────────────────────────────────────────
  crearUsuario(data: {
    apodo: string; password: string; tipo: string; pareja_de?: string;
  }, pin: string): Observable<UsuarioLocal> {
    return this.http.post<UsuarioLocal>(`${BASE}/admin/usuarios`, data, { headers: this.adminHeaders(pin) });
  }

  getUsuariosAdmin(pin: string): Observable<UsuarioLocal[]> {
    return this.http.get<UsuarioLocal[]>(`${BASE}/admin/usuarios`, { headers: this.adminHeaders(pin) });
  }

  eliminarUsuario(id: string, pin: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${BASE}/admin/usuarios/${id}`, { headers: this.adminHeaders(pin) });
  }

  getOfertasAdmin(pin: string): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(`${BASE}/admin/ofertas`, { headers: this.adminHeaders(pin) });
  }

  ponderarOferta(id: string, ponderacion: number, pin: string): Observable<Oferta> {
    return this.http.put<Oferta>(`${BASE}/admin/ofertas/${id}/ponderar`, { ponderacion }, { headers: this.adminHeaders(pin) });
  }

  toggleOferta(id: string, disponible: boolean, pin: string): Observable<Oferta> {
    return this.http.put<Oferta>(`${BASE}/admin/ofertas/${id}/toggle`, { disponible }, { headers: this.adminHeaders(pin) });
  }

  cerrarNoche(pin: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${BASE}/admin/noche`, { headers: this.adminHeaders(pin) });
  }
}
