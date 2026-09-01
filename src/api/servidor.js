import express from 'express';
import { config } from '../config.js';
import { criarRotas } from './rotas.js';

// Confere o token secreto no cabecalho Authorization: Bearer <API_TOKEN>.
function autenticar(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (token !== config.apiToken) return res.status(401).json({ erro: 'Nao autorizado' });
  next();
}

export function criarServidor({ fila, ranking }) {
  const app = express();

  // Checagem publica de que o servidor esta no ar (sem token).
  app.get('/health', (_req, res) => res.json({ ok: true }));

  // Da aqui pra baixo, tudo exige o token.
  app.use(autenticar);
  app.use(criarRotas({ fila, ranking }));

  return app;
}
