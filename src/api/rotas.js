import express from 'express';

// Rotas protegidas que o Roblox consome.
export function criarRotas({ fila, ranking }) {
  const router = express.Router();

  // O Roblox pergunta "o que aconteceu desde este cursor?"
  // Filtro opcional por tipo:
  //   /events?desde=0                   -> todos os eventos
  //   /events?desde=0&tipo=presente     -> só presentes
  //   /events?desde=0&tipos=like,follow -> likes e follows
  router.get('/events', (req, res) => {
    const cursor = Number(req.query.desde) || 0;
    const { eventos, cursor: novoCursor } = fila.desde(cursor);

    const filtro = req.query.tipos || req.query.tipo;
    let saida = eventos;
    if (filtro) {
      const desejados = new Set(
        String(filtro)
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
      );
      saida = eventos.filter((e) => desejados.has(e.tipo));
    }

    res.json({ eventos: saida, cursor: novoCursor });
  });

  // Placar atual, já ordenado.
  router.get('/ranking', (_req, res) => {
    res.json({ top: ranking.top() });
  });

  return router;
}