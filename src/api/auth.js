// src/api/auth.js
import { config } from '../config.js';

export function autenticarToken(req, res, next) {
  // Libera a checagem preliminar de CORS do navegador
  if (req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || token !== config.apiToken) {
    return res.status(401).json({ erro: 'Token inválido ou não informado.' });
  }

  next();
}