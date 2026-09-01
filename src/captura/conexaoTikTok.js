// src/captura/conexaoTikTok.js
import * as TikTool from '@tiktool/live';
import { config } from '../config.js';
import { log } from '../util/logger.js';
import { normalizarPresente, normalizarSimples } from './normalizador.js';

// src/captura/conexaoTikTok.js
export function iniciarCaptura(aoReceberEvento) {
  const Client =
    TikTool.TikTokLive ||
    TikTool.TikToolLive ||
    TikTool.Client ||
    TikTool.default ||
    TikTool;

  const conexao = new Client({
    apiKey: config.tikToolApiKey,
    uniqueId: config.tiktokUsername, // <-- Troque username por uniqueId
  });


  // Evento de presentes
  conexao.on('gift', (dados) => {
    const ehStreak = dados.giftType === 1 || dados.repeatEnd !== undefined;
    if (ehStreak && dados.repeatEnd === false) return;
    aoReceberEvento(normalizarPresente(dados));
  });

  // Eventos simples
  conexao.on('like', (d) => aoReceberEvento(normalizarSimples('like', d)));
  conexao.on('follow', (d) => aoReceberEvento(normalizarSimples('follow', d)));
  conexao.on('share', (d) => aoReceberEvento(normalizarSimples('share', d)));
  conexao.on('chat', (d) =>
    aoReceberEvento({ ...normalizarSimples('comentario', d), texto: d.comment || d.text }),
  );

  // Conexão inicial
  conexao
    .connect()
    .then((estado) => log.info(`Conectado à live via TikTool (Room ID: ${estado?.roomId || 'OK'})`))
    .catch((err) => log.erro('Falha ao conectar via TikTool:', err.message));

  // Reconexão em caso de queda
  conexao.on('disconnected', () => {
    log.aviso('Live desconectada. Tentando reconectar em 5s...');
    setTimeout(() => {
      conexao.connect().catch((e) => log.erro('Reconexao falhou:', e.message));
    }, 5000);
  });

  return conexao;
}