import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth';
import { Oferta, Usuario } from '../types';

const router = Router();

// GET /api/ofertas — público: muestra todas las aprobadas; si hay token filtra propias y pareja
router.get('/', optionalAuth, (req: AuthRequest, res: Response): void => {
  const todas = db
    .prepare('SELECT * FROM ofertas WHERE disponible = 1 AND ponderacion IS NOT NULL ORDER BY timestamp DESC')
    .all() as unknown as Oferta[];

  // Sin sesión: devolver todas
  if (!req.user) {
    res.json(todas);
    return;
  }

  const yo = db
    .prepare('SELECT * FROM usuarios WHERE id = ?')
    .get(req.user.userId) as unknown as Usuario | undefined;

  if (!yo) {
    res.json(todas);
    return;
  }

  const apodosExcluidos = new Set<string>([yo.apodo.toLowerCase()]);
  if (yo.pareja_de) apodosExcluidos.add(yo.pareja_de.toLowerCase());

  res.json(todas.filter((o) => !apodosExcluidos.has(o.vendedor_apodo.toLowerCase())));
});

// GET /api/ofertas/mias
router.get('/mias', requireAuth, (req: AuthRequest, res: Response): void => {
  const ofertas = db
    .prepare('SELECT * FROM ofertas WHERE vendedor_id = ? ORDER BY timestamp DESC')
    .all(req.user!.userId) as unknown as Oferta[];
  res.json(ofertas);
});

// GET /api/ofertas/vendedor/:id
router.get('/vendedor/:id', requireAuth, (req: Request, res: Response): void => {
  const ofertas = db
    .prepare('SELECT * FROM ofertas WHERE vendedor_id = ? AND disponible = 1 AND ponderacion IS NOT NULL')
    .all(String(req.params['id'])) as unknown as Oferta[];
  res.json(ofertas);
});

// POST /api/ofertas
router.post('/', requireAuth, (req: AuthRequest, res: Response): void => {
  const { titulo, descripcion, categoria } = req.body as {
    titulo?: string; descripcion?: string; categoria?: string;
  };

  if (!titulo?.trim() || !descripcion?.trim()) {
    res.status(400).json({ error: 'Título y descripción son obligatorios' });
    return;
  }
  if (!['tentador', 'atrevido', 'sin-limite'].includes(categoria ?? '')) {
    res.status(400).json({ error: 'Categoría inválida' });
    return;
  }

  const vendedor = db
    .prepare('SELECT apodo FROM usuarios WHERE id = ?')
    .get(req.user!.userId) as unknown as { apodo: string } | undefined;
  if (!vendedor) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }

  const oferta: Oferta = {
    id: uuid(),
    vendedor_id: req.user!.userId,
    vendedor_apodo: vendedor.apodo,
    titulo: titulo.trim(),
    descripcion: descripcion.trim(),
    categoria: categoria as Oferta['categoria'],
    ponderacion: null,
    disponible: 1,
    timestamp: Date.now(),
  };

  db.prepare(`
    INSERT INTO ofertas (id, vendedor_id, vendedor_apodo, titulo, descripcion, categoria, ponderacion, disponible, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    oferta.id, oferta.vendedor_id, oferta.vendedor_apodo,
    oferta.titulo, oferta.descripcion, oferta.categoria,
    oferta.ponderacion, oferta.disponible, oferta.timestamp
  );

  res.status(201).json(oferta);
});

// GET /api/ofertas/:id — busca una oferta concreta por ID (al final para no chocar con /mias)
router.get('/:id', requireAuth, (req: Request, res: Response): void => {
  const oferta = db
    .prepare('SELECT * FROM ofertas WHERE id = ? AND disponible = 1')
    .get(String(req.params['id'])) as unknown as Oferta | undefined;

  if (!oferta) {
    res.status(404).json({ error: 'Oferta no encontrada o no disponible' });
    return;
  }
  res.json(oferta);
});

export default router;
