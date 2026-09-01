import { config, validarConfig } from './config.js';
import { log } from './util/logger.js';
import { criarFila } from './nucleo/fila.js';
import { criarRanking } from './nucleo/ranking.js';
import { carregarMapa, acaoDoPresente } from './nucleo/mapaPresentes.js';
import { iniciarCaptura } from './captura/conexaoTikTok.js';
import { criarServidor } from './api/servidor.js';

// 1. Configuracao
validarConfig();
carregarMapa();

// 2. Estado em memoria
const fila = criarFila(config.tamanhoFila);
const ranking = criarRanking(config.topN);

// 3. Liga a captura do TikTok a fila e ao ranking
iniciarCaptura((evento) => {
  fila.adicionar(evento);

  if (evento.tipo === 'presente') {
    const pontos = (evento.valorMoedas || 0) * (evento.quantidade || 1);
    ranking.registrar(evento.usuario, evento.apelido, pontos);
    const acao = acaoDoPresente(evento.presenteId);
    log.info(`${evento.apelido} mandou ${evento.presenteNome} -> ${acao.acao} (+${pontos} pts)`);
  }
});

// 4. Sobe a API que o Roblox consulta
const app = criarServidor({ fila, ranking });
app.listen(config.porta, () => log.info(`API no ar em http://localhost:${config.porta}`));
