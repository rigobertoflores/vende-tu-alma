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
