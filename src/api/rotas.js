import express from 'express';

// Rotas protegidas que o Roblox consome.
export function criarRotas({ fila, ranking }) {
  const router = express.Router();

  // O Roblox pergunta "o que aconteceu desde este cursor?"
  router.get('/events', (req, res) => {
    const cursor = Number(req.query.desde) || 0;
    const { eventos, cursor: novoCursor } = fila.desde(cursor);
    res.json({ eventos, cursor: novoCursor });
  });

  // Placar atual, ja ordenado.
  router.get('/ranking', (_req, res) => {
    res.json({ top: ranking.top() });
  });

  return router;
}
