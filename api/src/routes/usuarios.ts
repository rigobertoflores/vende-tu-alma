import { Router, Response } from 'express';
import db from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { Usuario, sanitize } from '../types';

const router = Router();

// GET /api/usuarios/me
router.get('/me', requireAuth, (req: AuthRequest, res: Response): void => {
  const u = db
    .prepare('SELECT * FROM usuarios WHERE id = ?')
    .get(req.user!.userId) as unknown as Usuario | undefined;
  if (!u) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }
  res.json(sanitize(u));
});

// GET /api/usuarios/buscar?q=apodo
router.get('/buscar', requireAuth, (req: AuthRequest, res: Response): void => {
  const q = (req.query['q'] as string | undefined)?.trim();
  if (!q) { res.status(400).json({ error: 'Parámetro q requerido' }); return; }

  const encontrado = db
    .prepare('SELECT * FROM usuarios WHERE apodo = ? AND activo = 1')
    .get(q) as unknown as Usuario | undefined;

  if (!encontrado) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }

  const yo = db
    .prepare('SELECT * FROM usuarios WHERE id = ?')
    .get(req.user!.userId) as unknown as Usuario | undefined;

  if (yo) {
    if (encontrado.id === yo.id) {
      res.status(403).json({ error: 'No puedes buscarte a ti mismo' });
      return;
    }
    // Bloquear búsqueda de la pareja registrada
    const esPareja =
      (yo.pareja_de?.toLowerCase() === encontrado.apodo.toLowerCase()) ||
      (encontrado.pareja_de?.toLowerCase() === yo.apodo.toLowerCase());

    if (esPareja) {
      res.status(403).json({ error: 'No puedes buscar a tu pareja registrada' });
      return;
    }
  }

  res.json(sanitize(encontrado));
});

// GET /api/usuarios/marcador
router.get('/marcador', (_req, res: Response): void => {
  const lista = db
    .prepare('SELECT * FROM usuarios WHERE activo = 1 ORDER BY creditos DESC')
    .all() as unknown as Usuario[];
  res.json(lista.map(sanitize));
});

export default router;
