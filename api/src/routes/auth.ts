import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db';
import { signToken } from '../middleware/auth';
import { Usuario, sanitize } from '../types';

const router = Router();

// POST /api/auth/login — login para todos los usuarios
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { apodo, password } = req.body as { apodo?: string; password?: string };

  if (!apodo?.trim() || !password?.trim()) {
    res.status(400).json({ error: 'Apodo y contraseña son obligatorios' });
    return;
  }

  const usuario = db
    .prepare('SELECT * FROM usuarios WHERE apodo = ? AND activo = 1')
    .get(apodo.trim()) as unknown as Usuario | undefined;

  if (!usuario) {
    res.status(401).json({ error: 'Apodo o contraseña incorrectos' });
    return;
  }

  const ok = await bcrypt.compare(password.trim(), usuario.password_hash);
  if (!ok) {
    res.status(401).json({ error: 'Apodo o contraseña incorrectos' });
    return;
  }

  const token = signToken({ userId: usuario.id, apodo: usuario.apodo });
  res.json({ usuario: sanitize(usuario), token });
});

export default router;
