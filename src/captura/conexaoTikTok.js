import * as TikTool from '@tiktool/live';
import { config } from '../config.js';
import { log } from '../util/logger.js';
import { normalizarEvento } from './normalizador.js';

export function criarGerenciadorTikTok(aoReceberEvento) {
  let conexaoAtual = null;
  let usuarioAlvo = null;
  let conectado = false;
  let tentarReconectar = false;
  let timerReconexao = null;

  const Client =
    TikTool.TikTokLive ||
    TikTool.TikToolLive ||
    TikTool.Client ||
    TikTool.default;

  async function desconectar() {
    tentarReconectar = false;
    if (timerReconexao) clearTimeout(timerReconexao);

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
    tentarReconectar = true;
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
      
      // Reconecta automaticamente após 5 segundos se a desconexão não foi manual
      if (tentarReconectar && usuarioAlvo) {
        log.info(`Tentando reconectar em 5 segundos...`);
        timerReconexao = setTimeout(() => {
          conectar(usuarioAlvo).catch((e) => log.erro('Falha na reconexão:', e.message));
        }, 5000);
      }
    });

    conexaoAtual.on('error', (err) => {
      log.erro('Erro na conexão do TikTok:', err.message || err);
    });

    // Eventos principais
    conexaoAtual.on('chat', (data) => aoReceberEvento(normalizarEvento('comentario', data)));
    conexaoAtual.on('gift', (data) => aoReceberEvento(normalizarEvento('presente', data)));
    conexaoAtual.on('like', (data) => aoReceberEvento(normalizarEvento('like', data)));
    conexaoAtual.on('follow', (data) => aoReceberEvento(normalizarEvento('follow', data)));

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