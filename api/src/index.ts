import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import usuariosRouter from './routes/usuarios';
import ofertasRouter from './routes/ofertas';
import tratosRouter from './routes/tratos';
import adminRouter from './routes/admin';

const app = express();
const PORT = process.env['PORT'] ?? 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use('/api/auth', authRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/ofertas', ofertasRouter);
app.use('/api/tratos', tratosRouter);
app.use('/api/admin', adminRouter);

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

app.listen(PORT, () => {
  console.log(`🔥 Vende tu Alma API → http://localhost:${PORT}`);
});
