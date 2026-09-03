// src/index.js
import { config, validarConfig } from './config.js';
import { log } from './util/logger.js';
import { criarFila } from './nucleo/fila.js';
import { criarRanking } from './nucleo/ranking.js';
import { carregarMapa } from './nucleo/mapaPresentes.js';
import { criarGerenciadorTikTok } from './captura/conexaoTikTok.js';
import { criarServidor } from './api/servidor.js';

validarConfig();
carregarMapa();

const fila = criarFila(config.tamanhoFila);
const ranking = criarRanking(config.topN, 30);

// Estado dinâmico de sessão
let multiplicadorAura = config.multiplicadorPadrao;

// Ciclo automático de 30 minutos
const MINUTOS_CICLO = 30;
setInterval(() => {
  const vencedor = ranking.top()[0];
  log.info(`--- CICLO DE 30 MIN FINALIZADO! Vencedor: ${vencedor ? vencedor.apelido : 'Nenhum'} ---`);

  fila.adicionar({
    tipo: 'reset_ranking',
    vencedor: vencedor || null,
    timestamp: Date.now(),
  });
  ranking.zerar();
}, MINUTOS_CICLO * 60 * 1000);

// Criação do Gerenciador de Captura
const gerenciadorTikTok = criarGerenciadorTikTok((evento) => {
  let auraGanha = 0;

  if (evento.tipo === 'presente') {
    const moedasUnitarias = evento.valorMoedas || 1;
    const quantidade = evento.quantidade || 1;
    auraGanha = moedasUnitarias * quantidade * 5000;
  } else if (evento.tipo === 'like') {
    const qtd = evento.quantidade || 1;
    auraGanha = qtd * 1;
  } else if (evento.tipo === 'comentario') {
    auraGanha = 250;
  } else if (evento.tipo === 'follow') {
    auraGanha = 2000;
  }

  // Aplica o multiplicador dinâmico de evento
  auraGanha = Math.floor(auraGanha * multiplicadorAura);

  const auraTotalAcumulada = ranking.registrar(evento.usuario, evento.apelido, auraGanha);
  fila.adicionar({
    ...evento,
    auraTotal: auraTotalAcumulada,
    auraGanha,
  });
});

// Se houver um username configurado no .env, conecta automaticamente; senão, aguarda comando via API
if (config.tiktokUsername) {
  gerenciadorTikTok.conectar(config.tiktokUsername).catch((err) => {
    log.aviso('Aguardando comando de conexão via API/Roblox...');
  });
}

// Servidor Express
const app = criarServidor({
  fila,
  ranking,
  gerenciadorTikTok,
  obterMultiplicador: () => multiplicadorAura,
  definirMultiplicador: (novoMult) => {
    multiplicadorAura = novoMult;
    return multiplicadorAura;
  },
});

app.listen(config.porta, () => log.info(`API no ar em http://localhost:${config.porta}`));