// src/api/servidor.js
import express from 'express';
import cors from 'cors';
import { autenticarToken } from './auth.js';

export function criarServidor({ fila, ranking }) {
  const app = express();

  // Habilita CORS completo para qualquer origem e headers de autorização
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  app.use(express.json());
  app.use(express.static('public'));

  app.get('/events', autenticarToken, (req, res) => {
    const cursor = parseInt(req.query.desde, 10) || 0;
    res.json(fila.desde(cursor));
  });

  app.get('/ranking', autenticarToken, (req, res) => {
    res.json({
      top: ranking.top(),
      tempoRestante: ranking.tempoRestanteSegundos ? ranking.tempoRestanteSegundos() : 0,
    });
  });

  app.post('/events/simular', autenticarToken, (req, res) => {
    const { tipo, usuario, apelido, quantidade, valorMoedas, presenteNome } = req.body;
    let auraGanha = 0;

    if (tipo === 'presente') {
      auraGanha = (valorMoedas || 1) * (quantidade || 1) * 100;
    } else if (tipo === 'like') {
      auraGanha = (quantidade || 1) * 1;
    } else if (tipo === 'comentario') {
      auraGanha = 5;
    } else if (tipo === 'follow') {
      auraGanha = 20;
    }

    const auraTotal = ranking.registrar(usuario, apelido, auraGanha);
    const eventoAdicionado = fila.adicionar({
      tipo,
      usuario,
      apelido,
      quantidade: quantidade || 1,
      valorMoedas: valorMoedas || 0,
      presenteNome: presenteNome || '',
      auraTotal,
      auraGanha,
      timestamp: Date.now(),
    });

    res.json({ sucesso: true, evento: eventoAdicionado });
  });

  return app;
}