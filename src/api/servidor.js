// src/api/servidor.js
import express from 'express';
import cors from 'cors';
import { autenticarToken } from './auth.js';

export function criarServidor({
  fila,
  ranking,
  gerenciadorTikTok,
  obterMultiplicador,
  definirMultiplicador,
}) {
  const app = express();

  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );
  app.use(express.json());
  app.use(express.static('public'));

  // ROTA RAIZ DE HEALTH CHECK
  app.get('/', (_req, res) => {
    res.json({ status: 'online', service: 'TikTok Live Connector Engine' });
  });

  // --- ROTAS DO ROBLOX GAMEPLAY ---
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

  // --- ROTAS ADMINISTRATIVAS DINÂMICAS ---

  // 1. Conectar/Trocar de Perfil
  app.post('/admin/live/connect', autenticarToken, async (req, res) => {
    const { username } = req.body;
    try {
      const resultado = await gerenciadorTikTok.conectar(username);
      res.json({ sucesso: true, dados: resultado });
    } catch (err) {
      res.status(500).json({ sucesso: false, erro: err.message });
    }
  });

  // 2. Desconectar da Live
  app.post('/admin/live/disconnect', autenticarToken, async (_req, res) => {
    try {
      await gerenciadorTikTok.desconectar();
      res.json({ sucesso: true, mensagem: 'Desconectado com sucesso.' });
    } catch (err) {
      res.status(500).json({ sucesso: false, erro: err.message });
    }
  });

  // 3. Status Geral da Sessão
  app.get('/admin/live/status', autenticarToken, (_req, res) => {
    res.json({
      tiktok: gerenciadorTikTok.obterStatus(),
      multiplicador: obterMultiplicador(),
      tempoRestanteRanking: ranking.tempoRestanteSegundos ? ranking.tempoRestanteSegundos() : 0,
    });
  });

  // 4. Alterar Multiplicador de Aura em Tempo Real
  app.post('/admin/config/multiplicador', autenticarToken, (req, res) => {
    const { multiplicador } = req.body;
    const valor = Number(multiplicador);
    if (!valor || valor <= 0) {
      return res.status(400).json({ erro: 'Multiplicador inválido.' });
    }
    const atualizado = definirMultiplicador(valor);
    res.json({ sucesso: true, multiplicador: atualizado });
  });

  // Simulação de Eventos (Existente)
  app.post('/events/simular', autenticarToken, (req, res) => {
    const { tipo, usuario, apelido, quantidade, valorMoedas, presenteNome } = req.body;
    let auraGanha = 0;
    if (tipo === 'presente') {
      auraGanha = (valorMoedas || 1) * (quantidade || 1) * 5000;
    } else if (tipo === 'like') {
      auraGanha = (quantidade || 1) * 1;
    } else if (tipo === 'comentario') {
      auraGanha = 250;
    } else if (tipo === 'follow') {
      auraGanha = 2000;
    }

    auraGanha = Math.floor(auraGanha * obterMultiplicador());

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

  app.post('/admin/ranking/zerar', autenticarToken, (_req, res) => {
    try {
      ranking.zerar();
      // Notifica o Roblox via fila para atualizar/resetar na hora
      fila.adicionar({
        tipo: 'reset_ranking',
        vencedor: null,
        timestamp: Date.now(),
      });
      res.json({ sucesso: true, mensagem: 'Pontuação de todos os usuários zerada com sucesso!' });
    } catch (err) {
      res.status(500).json({ sucesso: false, erro: err.message });
    }
  });

  app.post('/admin/fila/limpar', autenticarToken, (_req, res) => {
    try {
      const resultado = fila.limpar();
      res.json({ sucesso: true, ...resultado });
    } catch (err) {
      res.status(500).json({ sucesso: false, erro: err.message });
    }
  });

  return app;
}