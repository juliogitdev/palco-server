// Transforma o evento cru do TikTok-Live-Connector no formato padrao do projeto.
// Formato do Evento:
// { tipo, usuario, apelido, presenteId, presenteNome, valorMoedas, quantidade, timestamp }
//
// OBS: os nomes dos campos abaixo (giftId, diamondCount, repeatCount, user.uniqueId,
// user.nickname) seguem o schema da lib. Se algum vier vazio, confira a doc da versao
// instalada — o schema v3 renomeou alguns campos.

export function normalizarPresente(dados) {
  return {
    tipo: 'presente',
    usuario: dados.user?.uniqueId ?? 'desconhecido',
    apelido: dados.user?.nickname ?? dados.user?.uniqueId ?? 'Alguem',
    presenteId: dados.giftId,
    presenteNome: dados.giftName ?? String(dados.giftId),
    valorMoedas: dados.diamondCount ?? 0,
    quantidade: dados.repeatCount ?? 1,
    timestamp: Date.now(),
  };
}

export function normalizarSimples(tipo, dados) {
  return {
    tipo,
    usuario: dados.user?.uniqueId ?? 'desconhecido',
    apelido: dados.user?.nickname ?? dados.user?.uniqueId ?? 'Alguem',
    valorMoedas: 0,
    quantidade: 1,
    timestamp: Date.now(),
  };
}
