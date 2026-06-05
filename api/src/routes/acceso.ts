// Auto-registro eliminado: todos los usuarios los crea el administrador.
import { Router } from 'express';
const router = Router();
router.all('*', (_req, res) => res.status(410).json({ error: 'Auto-registro deshabilitado' }));
export default router;
