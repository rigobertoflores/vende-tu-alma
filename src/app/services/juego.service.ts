import { Injectable, signal } from '@angular/core';

export type TipoUsuario = 'pareja' | 'unicornio';
export type CategoriaOferta = 'tentador' | 'atrevido' | 'sin-limite';

export interface UsuarioLocal {
  id: string;
  apodo: string;
  tipo: TipoUsuario;
  pareja_de: string | null;
  password_plain?: string;
  creditos: number;
  activo: number;
  timestamp_entrada: number;
}

export interface Oferta {
  id: string;
  vendedor_id: string;
  vendedor_apodo: string;
  titulo: string;
  descripcion: string;
  categoria: CategoriaOferta;
  ponderacion: number | null;
  disponible: boolean;
  timestamp: number;
}

const STORAGE_USER = 'vta_user';

@Injectable({ providedIn: 'root' })
export class JuegoService {
  private usuarioSignal = signal<UsuarioLocal | null>(this.readUsuario());

  private readUsuario(): UsuarioLocal | null {
    const raw = localStorage.getItem(STORAGE_USER);
    if (!raw) return null;
    try { return JSON.parse(raw) as UsuarioLocal; }
    catch { localStorage.removeItem(STORAGE_USER); return null; }
  }

  getUsuarioActual(): UsuarioLocal | null {
    return this.usuarioSignal();
  }

  guardarUsuario(usuario: UsuarioLocal): void {
    localStorage.setItem(STORAGE_USER, JSON.stringify(usuario));
    this.usuarioSignal.set(usuario);
  }

  cerrarNoche(): void {
    localStorage.removeItem(STORAGE_USER);
    this.usuarioSignal.set(null);
  }
}
