import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { Oferta, Usuario } from '../types';

const router = Router();

// POST /api/tratos  — confirmar un trato
router.post('/', requireAuth, (req: AuthRequest, res: Response): void => {
  const { oferta_id } = req.body as { oferta_id?: string };

  if (!oferta_id) {
    res.status(400).json({ error: 'oferta_id es obligatorio' });
    return;
  }

  const comprador = db
    .prepare('SELECT * FROM usuarios WHERE id = ?')
    .get(req.user!.userId) as unknown as Usuario | undefined;

  if (!comprador) {
    res.status(404).json({ error: 'Comprador no encontrado' });
    return;
  }

  const oferta = db
    .prepare('SELECT * FROM ofertas WHERE id = ?')
    .get(oferta_id) as unknown as Oferta | undefined;

  if (!oferta) { res.status(404).json({ error: 'Oferta no encontrada' }); return; }
  if (!oferta.disponible) { res.status(409).json({ error: 'La oferta ya no está disponible' }); return; }
  if (oferta.ponderacion === null) { res.status(409).json({ error: 'La oferta aún no tiene créditos asignados' }); return; }
  if (oferta.vendedor_id === comprador.id) { res.status(403).json({ error: 'No puedes comprarte tu propia oferta' }); return; }
  if (comprador.creditos < oferta.ponderacion) { res.status(409).json({ error: 'Créditos insuficientes' }); return; }

  const vendedor = db
    .prepare('SELECT * FROM usuarios WHERE id = ?')
    .get(oferta.vendedor_id) as unknown as Usuario | undefined;

  if (!vendedor) {
    res.status(404).json({ error: 'Vendedor no encontrado' });
    return;
  }

  const tratoId = uuid();
  const ahora = Date.now();

  db.exec('BEGIN TRANSACTION');
  try {
    db.prepare('UPDATE usuarios SET creditos = creditos - ? WHERE id = ?')
      .run(oferta.ponderacion, comprador.id);

    db.prepare('UPDATE usuarios SET creditos = creditos + ? WHERE id = ?')
      .run(oferta.ponderacion, vendedor.id);

    db.prepare('UPDATE ofertas SET disponible = 0 WHERE id = ?')
      .run(oferta.id);

    db.prepare(`
      INSERT INTO tratos (id, oferta_id, comprador_id, vendedor_id, creditos_transferidos, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(tratoId, oferta.id, comprador.id, vendedor.id, oferta.ponderacion, ahora);

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: 'Error al procesar el trato' });
    return;
  }

  res.status(201).json({
    trato: { id: tratoId, oferta_id: oferta.id, comprador_id: comprador.id, vendedor_id: vendedor.id, creditos_transferidos: oferta.ponderacion, timestamp: ahora },
    comprador_creditos: comprador.creditos - oferta.ponderacion,
    vendedor_creditos: vendedor.creditos + oferta.ponderacion,
  });
});

// GET /api/tratos/mis-ventas — tratos donde el usuario es vendedor (para notificaciones)
router.get('/mis-ventas', requireAuth, (req: AuthRequest, res: Response): void => {
  const ventas = db.prepare(`
    SELECT t.id, t.timestamp, t.creditos_transferidos,
           o.titulo as oferta_titulo,
           c.apodo as comprador_apodo
    FROM tratos t
    JOIN ofertas  o ON o.id = t.oferta_id
    JOIN usuarios c ON c.id = t.comprador_id
    WHERE t.vendedor_id = ?
    ORDER BY t.timestamp DESC
    LIMIT 20
  `).all(req.user!.userId);
  res.json(ventas);
});

export default router;
