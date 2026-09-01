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
    auraGanha = (evento.valorMoedas || 1) * (evento.quantidade || 1) * 100;
  } else if (evento.tipo === 'like') {
    // Multiplica 1 ponto por cada curtida computada na rajada
    const qtd = evento.quantidade || 1;
    auraGanha = qtd * 1;
  } else if (evento.tipo === 'comentario') {
    auraGanha = 5;
  } else if (evento.tipo === 'follow') {
    auraGanha = 20;
  }

  // Registra e acumula no ranking
  const auraTotalAcumulada = ranking.registrar(evento.usuario, evento.apelido, auraGanha);

  fila.adicionar({
    ...evento,
    auraTotal: auraTotalAcumulada,
    auraGanha,
  });
});

const app = criarServidor({ fila, ranking });
app.listen(config.porta, () => log.info(`API no ar em http://localhost:${config.porta}`));