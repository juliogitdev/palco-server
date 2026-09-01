// src/captura/normalizador.js

function limparNomeParaRoblox(texto) {
  if (!texto) return 'Convidado';

  // 1. Decompõe caracteres decorativos/matemáticos em letras padrão
  let limpo = String(texto).normalize('NFKD');

  // 2. Remove caracteres invisíveis ou variações de fontes não suportadas no Roblox
  limpo = limpo.replace(/[^\p{L}\p{N}\p{P}\p{Z}\p{Emoji}]/gu, '');

  // 3. Remove espaços extras
  limpo = limpo.trim();

  return limpo.length > 0 ? limpo : 'Convidado';
}

function extrairInfoUsuario(dados) {
  const usuarioCru =
    dados.uniqueId ??
    dados.user?.uniqueId ??
    dados.user?.displayId ??
    dados.userId ??
    'Convidado';

  const apelidoCru =
    dados.nickname ??
    dados.user?.nickname ??
    dados.user?.nickName ??
    usuarioCru;

  return {
    usuario: limparNomeParaRoblox(usuarioCru),
    apelido: limparNomeParaRoblox(apelidoCru),
  };
}

export function normalizarEvento(tipo, dados) {
  const infoUsuario = extrairInfoUsuario(dados);

  if (tipo === 'presente') {
    return {
      tipo: 'presente',
      ...infoUsuario,
      presenteId: dados.giftId ?? dados.gift?.id,
      presenteNome: dados.giftName ?? dados.gift?.name ?? 'Presente',
      valorMoedas: dados.diamondCount ?? dados.gift?.diamondCount ?? 1,
      quantidade: dados.repeatCount ?? dados.count ?? 1,
      timestamp: Date.now(),
    };
  }

  if (tipo === 'like') {
    const quantidadeLikes =
      dados.likeCount ??
      dados.count ??
      dados.likes ??
      1;

    return {
      tipo: 'like',
      ...infoUsuario,
      quantidade: Math.max(1, Number(quantidadeLikes)),
      timestamp: Date.now(),
    };
  }

  if (tipo === 'comentario') {
    return {
      tipo: 'comentario',
      ...infoUsuario,
      comentario: dados.comment ?? dados.text ?? '',
      timestamp: Date.now(),
    };
  }

  if (tipo === 'follow') {
    return {
      tipo: 'follow',
      ...infoUsuario,
      timestamp: Date.now(),
    };
  }

  return {
    tipo,
    ...infoUsuario,
    timestamp: Date.now(),
  };
}