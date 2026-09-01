// src/captura/conexaoTikTok.js
import * as TikTool from '@tiktool/live';
import { config } from '../config.js';
import { log } from '../util/logger.js';
import { normalizarEvento } from './normalizador.js';

export function iniciarCaptura(aoReceberEvento) {
  const Client =
    TikTool.TikTokLive ||
    TikTool.TikToolLive ||
    TikTool.Client ||
    TikTool.default;

  const conexao = new Client({
    apiKey: config.tikToolApiKey,
    uniqueId: config.tiktokUsername,
  });

  conexao.on('connected', () => {
    log.info(`Conectado à live do @${config.tiktokUsername}`);
  });

  conexao.on('disconnected', () => {
    log.warn('Conexão com o TikTok perdida.');
  });

  conexao.on('error', (err) => {
    log.erro('Erro na conexão do TikTok:', err);
  });

  conexao.on('chat', (data) => aoReceberEvento(normalizarEvento('comentario', data)));
  conexao.on('gift', (data) => aoReceberEvento(normalizarEvento('presente', data)));
  conexao.on('like', (data) => aoReceberEvento(normalizarEvento('like', data)));
  conexao.on('follow', (data) => aoReceberEvento(normalizarEvento('follow', data)));

  conexao.connect().catch((err) => {
    log.erro('Falha ao iniciar conexão inicial:', err);
  });

  return conexao;
}