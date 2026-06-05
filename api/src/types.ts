export type TipoUsuario = 'pareja' | 'unicornio';
export type CategoriaOferta = 'tentador' | 'atrevido' | 'sin-limite';

export interface Usuario {
  id: string;
  apodo: string;
  password_hash: string;
  password_plain: string;
  tipo: TipoUsuario;
  pareja_de: string | null;
  creditos: number;
  activo: number;
  timestamp_entrada: number;
}

/** Sin hash para clientes normales */
export type UsuarioPublico = Omit<Usuario, 'password_hash' | 'password_plain'>;
/** Con contraseña visible solo para admin */
export type UsuarioAdmin = Omit<Usuario, 'password_hash'>;

export interface Oferta {
  id: string;
  vendedor_id: string;
  vendedor_apodo: string;
  titulo: string;
  descripcion: string;
  categoria: CategoriaOferta;
  ponderacion: number | null;
  disponible: number;
  timestamp: number;
}

export interface Trato {
  id: string;
  oferta_id: string;
  comprador_id: string;
  vendedor_id: string;
  creditos_transferidos: number;
  timestamp: number;
}

export interface TokenPayload {
  userId: string;
  apodo: string;
}

/** Para clientes normales — quita hash y contraseña plana */
export function sanitize(u: Usuario): UsuarioPublico {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, password_plain, ...pub } = u;
  return pub;
}

/** Para admin — quita solo el hash, conserva password_plain */
export function sanitizeAdmin(u: Usuario): UsuarioAdmin {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...pub } = u;
  return pub;
}
