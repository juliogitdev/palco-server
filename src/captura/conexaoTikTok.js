import { TikTokLiveConnection, WebcastEvent } from 'tiktok-live-connector';
import { config } from '../config.js';
import { log } from '../util/logger.js';
import { normalizarPresente, normalizarSimples } from './normalizador.js';

// Conecta na live e chama `aoReceberEvento(evento)` para cada evento ja normalizado.
export function iniciarCaptura(aoReceberEvento) {
  const conexao = new TikTokLiveConnection(config.tiktokUsername, {
    // Se tiver chave da Euler Stream, descomente para aumentar os limites:
    // signApiKey: config.eulerApiKey || undefined,
  });

  conexao.on(WebcastEvent.GIFT, (dados) => {
    // Presentes "streakaveis" (rosa, etc.) mandam varios eventos parciais enquanto a
    // pessoa segura o envio. So contamos quando o streak termina (repeatEnd),
    // senao a mesma rosa seria contada varias vezes.
    const ehStreak = dados.giftType === 1;
    if (ehStreak && !dados.repeatEnd) return;
    aoReceberEvento(normalizarPresente(dados));
  });

  conexao.on(WebcastEvent.LIKE, (d) => aoReceberEvento(normalizarSimples('like', d)));
  conexao.on(WebcastEvent.FOLLOW, (d) => aoReceberEvento(normalizarSimples('follow', d)));
  conexao.on(WebcastEvent.SHARE, (d) => aoReceberEvento(normalizarSimples('share', d)));
  conexao.on(WebcastEvent.CHAT, (d) =>
    aoReceberEvento({ ...normalizarSimples('comentario', d), texto: d.comment }),
  );

  conexao.connect()
    .then((estado) => log.info(`Conectado a live (roomId ${estado.roomId})`))
    .catch((err) => log.erro('Falha ao conectar na live:', err.message));

  // Reconexao simples caso a live caia e volte.
  conexao.on('disconnected', () => {
    log.aviso('Live desconectada. Tentando reconectar em 5s...');
    setTimeout(
      () => conexao.connect().catch((e) => log.erro('Reconexao falhou:', e.message)),
      5000,
    );
  });

  return conexao;
}
