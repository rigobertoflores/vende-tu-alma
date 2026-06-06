import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import db from '../db';
import { Oferta, Usuario, sanitizeAdmin } from '../types';

const router = Router();

const ADMIN_PIN = process.env['ADMIN_PIN'] ?? '6969';

function requirePin(req: Request, res: Response, next: () => void): void {
  const pin = req.headers['x-admin-pin'] as string | undefined;
  if (pin !== ADMIN_PIN) {
    res.status(401).json({ error: 'PIN incorrecto' });
    return;
  }
  next();
}

// POST /api/admin/usuarios — crear usuario (pareja o unicornio)
router.post('/usuarios', requirePin, async (req: Request, res: Response): Promise<void> => {
  const { apodo, password, tipo, pareja_de } = req.body as {
    apodo?: string;
    password?: string;
    tipo?: string;
    pareja_de?: string;
  };

  if (!apodo?.trim() || !password?.trim()) {
    res.status(400).json({ error: 'Apodo y contraseña son obligatorios' });
    return;
  }
  if (tipo !== 'pareja' && tipo !== 'unicornio') {
    res.status(400).json({ error: 'Tipo debe ser pareja o unicornio' });
    return;
  }
  if (tipo === 'pareja' && !pareja_de?.trim()) {
    res.status(400).json({ error: 'Para tipo pareja debes indicar el apodo de su pareja' });
    return;
  }

  const existe = db
    .prepare('SELECT id FROM usuarios WHERE apodo = ?')
    .get(apodo.trim()) as unknown;
  if (existe) {
    res.status(409).json({ error: `El apodo "${apodo.trim()}" ya está en uso` });
    return;
  }

  const hash = await bcrypt.hash(password.trim(), 10);

  const usuario: Usuario = {
    id: uuid(),
    apodo: apodo.trim(),
    password_hash: hash,
    password_plain: password.trim(),
    tipo,
    pareja_de: tipo === 'pareja' ? (pareja_de?.trim() ?? null) : null,
    creditos: 100,
    activo: 1,
    timestamp_entrada: Date.now(),
  };

  db.prepare(`
    INSERT INTO usuarios (id, apodo, password_hash, password_plain, tipo, pareja_de, creditos, activo, timestamp_entrada)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    usuario.id, usuario.apodo, usuario.password_hash, usuario.password_plain,
    usuario.tipo, usuario.pareja_de, usuario.creditos, usuario.activo, usuario.timestamp_entrada
  );

  res.status(201).json(sanitizeAdmin(usuario));
});

// GET /api/admin/usuarios — devuelve contraseña visible para el admin
router.get('/usuarios', requirePin, (_req, res: Response): void => {
  const usuarios = db
    .prepare('SELECT * FROM usuarios ORDER BY tipo, apodo')
    .all() as unknown as Usuario[];
  res.json(usuarios.map(sanitizeAdmin));
});

// DELETE /api/admin/usuarios/:id
router.delete('/usuarios/:id', requirePin, (req: Request, res: Response): void => {
  const id = String(req.params['id']);
  const result = db.prepare('DELETE FROM usuarios WHERE id = ?').run(id);
  if (result.changes === 0) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }
  res.json({ message: 'Usuario eliminado' });
});

// DELETE /api/admin/ofertas/:id
router.delete('/ofertas/:id', requirePin, (req: Request, res: Response): void => {
  const id = String(req.params['id']);
  const result = db.prepare('DELETE FROM ofertas WHERE id = ?').run(id);
  if (result.changes === 0) { res.status(404).json({ error: 'Oferta no encontrada' }); return; }
  res.json({ message: 'Oferta eliminada' });
});

// GET /api/admin/ofertas
router.get('/ofertas', requirePin, (_req, res: Response): void => {
  const ofertas = db
    .prepare('SELECT * FROM ofertas ORDER BY timestamp DESC')
    .all() as unknown as Oferta[];
  res.json(ofertas);
});

// PUT /api/admin/ofertas/:id/ponderar
router.put('/ofertas/:id/ponderar', requirePin, (req: Request, res: Response): void => {
  const { ponderacion } = req.body as { ponderacion?: number };
  const id = String(req.params['id']);

  if (!ponderacion || ponderacion < 1) {
    res.status(400).json({ error: 'Ponderación debe ser mayor a 0' });
    return;
  }

  const result = db
    .prepare('UPDATE ofertas SET ponderacion = ?, disponible = 1 WHERE id = ?')
    .run(ponderacion, id);
  if (result.changes === 0) { res.status(404).json({ error: 'Oferta no encontrada' }); return; }

  res.json(db.prepare('SELECT * FROM ofertas WHERE id = ?').get(id) as unknown as Oferta);
});

// PUT /api/admin/ofertas/:id/toggle
router.put('/ofertas/:id/toggle', requirePin, (req: Request, res: Response): void => {
  const { disponible } = req.body as { disponible?: boolean };
  const id = String(req.params['id']);

  if (typeof disponible !== 'boolean') {
    res.status(400).json({ error: 'disponible debe ser true o false' });
    return;
  }
  db.prepare('UPDATE ofertas SET disponible = ? WHERE id = ?').run(disponible ? 1 : 0, id);
  res.json(db.prepare('SELECT * FROM ofertas WHERE id = ?').get(id) as unknown as Oferta);
});

// PUT /api/admin/usuarios/:id/creditos — editar créditos de un usuario
router.put('/usuarios/:id/creditos', requirePin, (req: Request, res: Response): void => {
  const { creditos } = req.body as { creditos?: number };
  const id = String(req.params['id']);
  if (typeof creditos !== 'number' || creditos < 0) {
    res.status(400).json({ error: 'Créditos debe ser un número >= 0' }); return;
  }
  const result = db.prepare('UPDATE usuarios SET creditos = ? WHERE id = ?').run(creditos, id);
  if (result.changes === 0) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }
  res.json(db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id));
});

// PUT /api/admin/usuarios/creditos/todos — asignar mismos créditos a todos
router.put('/usuarios/creditos/todos', requirePin, (req: Request, res: Response): void => {
  const { creditos } = req.body as { creditos?: number };
  if (typeof creditos !== 'number' || creditos < 0) {
    res.status(400).json({ error: 'Créditos debe ser un número >= 0' }); return;
  }
  db.prepare('UPDATE usuarios SET creditos = ?').run(creditos);
  res.json({ message: `Créditos de todos los usuarios actualizados a ${creditos}` });
});

// PUT /api/admin/ofertas/:id — editar oferta completa
router.put('/ofertas/:id', requirePin, (req: Request, res: Response): void => {
  const { titulo, descripcion, categoria, ponderacion, disponible } = req.body as {
    titulo?: string; descripcion?: string; categoria?: string;
    ponderacion?: number | null; disponible?: boolean;
  };
  const id = String(req.params['id']);
  const fields: string[] = [];
  const values: (string | number | null)[] = [];
  if (titulo !== undefined)      { fields.push('titulo = ?');      values.push(titulo); }
  if (descripcion !== undefined) { fields.push('descripcion = ?'); values.push(descripcion); }
  if (categoria !== undefined)   { fields.push('categoria = ?');   values.push(categoria); }
  if (ponderacion !== undefined) { fields.push('ponderacion = ?'); values.push(ponderacion); }
  if (disponible !== undefined)  { fields.push('disponible = ?');  values.push(disponible ? 1 : 0); }
  if (!fields.length) { res.status(400).json({ error: 'Nada que actualizar' }); return; }
  values.push(id);
  const result = db.prepare(`UPDATE ofertas SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  if (result.changes === 0) { res.status(404).json({ error: 'Oferta no encontrada' }); return; }
  res.json(db.prepare('SELECT * FROM ofertas WHERE id = ?').get(id));
});

// PUT /api/admin/ofertas/todas/toggle — activar o desactivar todas las ofertas
router.put('/ofertas/todas/toggle', requirePin, (req: Request, res: Response): void => {
  const { disponible } = req.body as { disponible?: boolean };
  if (typeof disponible !== 'boolean') {
    res.status(400).json({ error: 'disponible debe ser true o false' }); return;
  }
  db.prepare('UPDATE ofertas SET disponible = ? WHERE ponderacion IS NOT NULL').run(disponible ? 1 : 0);
  res.json({ message: disponible ? 'Todas las ofertas activadas' : 'Todas las ofertas desactivadas' });
});

// GET /api/admin/tratos — lista de todas las transacciones
router.get('/tratos', requirePin, (_req, res: Response): void => {
  const tratos = db.prepare(`
    SELECT t.id, t.timestamp, t.creditos_transferidos,
           o.titulo as oferta_titulo,
           c.apodo as comprador_apodo,
           v.apodo as vendedor_apodo
    FROM tratos t
    JOIN ofertas  o ON o.id = t.oferta_id
    JOIN usuarios c ON c.id = t.comprador_id
    JOIN usuarios v ON v.id = t.vendedor_id
    ORDER BY t.timestamp DESC
  `).all();
  res.json(tratos);
});

// DELETE /api/admin/noche — borrar todo y empezar de cero
router.delete('/noche', requirePin, (_req, res: Response): void => {
  db.exec('BEGIN TRANSACTION');
  db.exec('DELETE FROM tratos');
  db.exec('DELETE FROM ofertas');
  db.exec('DELETE FROM usuarios');
  db.exec('COMMIT');
  res.json({ message: 'Noche cerrada. Todos los datos eliminados.' });
});

export default router;
