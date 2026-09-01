// src/captura/normalizador.js

function extrairInfoUsuario(dados) {
  const usuario =
    dados.uniqueId ??
    dados.user?.uniqueId ??
    dados.user?.displayId ??
    dados.userId ??
    'desconhecido';

  const apelido =
    dados.nickname ??
    dados.user?.nickname ??
    (usuario !== 'desconhecido' ? usuario : 'Alguem');

  return { usuario, apelido };
}

export function normalizarPresente(dados) {
  const { usuario, apelido } = extrairInfoUsuario(dados);

  const valorUnitario =
    dados.diamondCount ??
    dados.diamonds ??
    dados.gift?.diamondCount ??
    (Number(dados.giftId) === 5655 ? 1 : 0);

  const presenteNome =
    dados.giftName ??
    dados.gift?.name ??
    (Number(dados.giftId) === 5655 ? 'Rosa' : String(dados.giftId));

  const quantidade = dados.repeatCount ?? dados.gift?.repeatCount ?? 1;

  return {
    tipo: 'presente',
    usuario,
    apelido,
    presenteId: Number(dados.giftId) || dados.giftId,
    presenteNome,
    valorMoedas: valorUnitario,
    quantidade,
    timestamp: Date.now(),
  };
}

export function normalizarSimples(tipo, dados) {
  const { usuario, apelido } = extrairInfoUsuario(dados);

  return {
    tipo,
    usuario,
    apelido,
    valorMoedas: 0,
    quantidade: 1,
    timestamp: Date.now(),
  };
}