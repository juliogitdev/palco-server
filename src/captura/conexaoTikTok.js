// src/captura/conexaoTikTok.js
import * as TikTool from '@tiktool/live';
import { config } from '../config.js';
import { log } from '../util/logger.js';
import { normalizarEvento } from './normalizador.js';

export function criarGerenciadorTikTok(aoReceberEvento) {
  let conexaoAtual = null;
  let usuarioAlvo = null;
  let conectado = false;

  const Client =
    TikTool.TikTokLive ||
    TikTool.TikToolLive ||
    TikTool.Client ||
    TikTool.default;

  async function desconectar() {
    if (conexaoAtual) {
      try {
        if (typeof conexaoAtual.disconnect === 'function') {
          await conexaoAtual.disconnect();
        }
      } catch (err) {
        log.aviso('Aviso ao desconectar sessão anterior:', err.message);
      }
      conexaoAtual = null;
    }
    conectado = false;
    usuarioAlvo = null;
  }

  async function conectar(novoUsuario) {
    const usuarioLimpo = novoUsuario ? novoUsuario.replace('@', '').trim() : '';
    if (!usuarioLimpo) {
      throw new Error('Username do TikTok inválido.');
    }

    await desconectar();

    usuarioAlvo = usuarioLimpo;
    log.info(`Iniciando conexão com @${usuarioAlvo}...`);

    conexaoAtual = new Client({
      apiKey: config.tikToolApiKey,
      uniqueId: usuarioAlvo,
    });

    conexaoAtual.on('connected', () => {
      conectado = true;
      log.info(`✅ Conectado com sucesso à live de @${usuarioAlvo}`);
    });

    conexaoAtual.on('disconnected', () => {
      conectado = false;
      log.aviso(`⚠️ Conexão com @${usuarioAlvo} foi encerrada.`);
    });

    conexaoAtual.on('error', (err) => {
      log.erro('Erro na conexão do TikTok:', err);
    });

    // EVENTOS CAPTURADOS:
    conexaoAtual.on('chat', (data) => aoReceberEvento(normalizarEvento('comentario', data)));
    conexaoAtual.on('gift', (data) => aoReceberEvento(normalizarEvento('presente', data)));
    conexaoAtual.on('like', (data) => aoReceberEvento(normalizarEvento('like', data)));
    conexaoAtual.on('follow', (data) => aoReceberEvento(normalizarEvento('follow', data)));
    
    // 👉 ADICIONADO: Captura quem acabou de entrar na live
    conexaoAtual.on('member', (data) => aoReceberEvento(normalizarEvento('entrada', data)));

    await conexaoAtual.connect();
    return { usuario: usuarioAlvo, status: 'conectando' };
  }

  function obterStatus() {
    return {
      conectado,
      usuario: usuarioAlvo,
    };
  }

  return {
    conectar,
    desconectar,
    obterStatus,
  };
}
