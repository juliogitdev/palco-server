// src/index.js
import { config, validarConfig } from './config.js';
import { log } from './util/logger.js';
import { criarFila } from './nucleo/fila.js';
import { criarRanking } from './nucleo/ranking.js';
import { carregarMapa, acaoDoPresente } from './nucleo/mapaPresentes.js';
import { iniciarCaptura } from './captura/conexaoTikTok.js';
import { criarServidor } from './api/servidor.js';

validarConfig();
carregarMapa();

const fila = criarFila(config.tamanhoFila);
const ranking = criarRanking(config.topN, 30); // 30 minutos por ciclo

// Ciclo automático de 30 minutos
const MINUTOS_CICLO = 30;
setInterval(() => {
  const vencedor = ranking.top()[0];
  log.info(`--- CICLO DE 30 MIN FINALIZADO! Vencedor: ${vencedor ? vencedor.apelido : 'Nenhum'} ---`);

  // Notifica o Roblox via fila de eventos
  fila.adicionar({
    tipo: 'reset_ranking',
    vencedor: vencedor || null,
    timestamp: Date.now(),
  });

  ranking.zerar();
}, MINUTOS_CICLO * 60 * 1000);

iniciarCaptura((evento) => {
  let auraGanha = 0;

  if (evento.tipo === 'presente') {
    // 1 moeda = 5.000 de aura (se a rosa for 1 moeda, dá 5.000)
    const moedasUnitarias = evento.valorMoedas || 1;
    const quantidade = evento.quantidade || 1;
    auraGanha = moedasUnitarias * quantidade * 5000;
  } else if (evento.tipo === 'like') {
    // 1 like = 1 de aura
    const qtd = evento.quantidade || 1;
    auraGanha = qtd * 1;
  } else if (evento.tipo === 'comentario') {
    // 1 comentário = 250 de aura
    auraGanha = 250;
  } else if (evento.tipo === 'follow') {
    // 1 seguidor = 2000 de aura
    auraGanha = 2000;
  }

  const auraTotalAcumulada = ranking.registrar(evento.usuario, evento.apelido, auraGanha);

  fila.adicionar({
    ...evento,
    auraTotal: auraTotalAcumulada,
    auraGanha,
  });
});

const app = criarServidor({ fila, ranking });
app.listen(config.porta, () => log.info(`API no ar em http://localhost:${config.porta}`));