// src/captura/normalizador.js

/**
 * Remove caracteres incompatíveis com as fontes do Roblox Studio.
 * Mantém letras (com acentos latinos), números e pontuação comum.
 * Remove emojis e símbolos que viram quadradinhos [][][] na tela.
 */
function limparTextoParaRoblox(texto) {
  if (!texto) return '';

  // 1. Normaliza caracteres acentuados para compatibilidade
  let limpo = String(texto).normalize('NFC');

  // 2. Remove emojis, caracteres matemáticos especiais e símbolos não renderizáveis no Roblox
  limpo = limpo.replace(
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
    ''
  );

  // 3. Mantém apenas letras latinas, números, acentos e pontuação legível
  limpo = limpo.replace(/[^\w\sÀ-ÿ.,!?'"_\-@#]/gi, '');

  // 4. Remove espaços múltiplos
  limpo = limpo.replace(/\s+/g, ' ').trim();

  return limpo;
}

/**
 * Garante que o identificador único (@ do TikTok) seja estritamente
 * seguro para ser usado como nome de objeto no Roblox Workspace (NPC_usuario).
 */
function limparUniqueId(texto) {
  if (!texto) return 'convidado';

  // O @ do TikTok só pode conter letras, números, ponto e underline
  let handle = String(texto)
    .replace(/^@/, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .trim();

  return handle.length > 0 ? handle : 'convidado';
}

function extrairInfoUsuario(dados) {
  if (!dados) {
    return { usuario: 'convidado', apelido: 'Convidado' };
  }

  // Busca o @ em todas as variações possíveis da lib do TikTok
  const usuarioCru =
    dados.uniqueId ??
    dados.user?.uniqueId ??
    dados.userDetails?.uniqueId ??
    dados.user?.displayId ??
    dados.userId ??
    'convidado';

  // Busca o apelido visível
  const apelidoCru =
    dados.nickname ??
    dados.user?.nickname ??
    dados.userDetails?.nickname ??
    dados.user?.nickName ??
    usuarioCru;

  const usuario = limparUniqueId(usuarioCru);
  let apelido = limparTextoParaRoblox(apelidoCru);

  // Se o apelido for composto só por emojis que foram limpos, usa o próprio @
  if (!apelido || apelido.length === 0) {
    apelido = usuario;
  }

  return {
    usuario,
    apelido,
  };
}

export function normalizarEvento(tipo, dados) {
  dados = dados || {};
  const infoUsuario = extrairInfoUsuario(dados);

  // 1. PRESENTE / GIFT
  if (tipo === 'presente' || tipo === 'gift') {
    return {
      tipo: 'presente',
      ...infoUsuario,
      presenteId: dados.giftId ?? dados.gift?.id ?? dados.giftDetails?.giftId,
      presenteNome: dados.giftName ?? dados.gift?.name ?? dados.giftDetails?.giftName ?? 'Presente',
      valorMoedas: Number(dados.diamondCount ?? dados.gift?.diamondCount ?? 1),
      quantidade: Number(dados.repeatCount ?? dados.repeat_count ?? dados.count ?? 1),
      timestamp: Date.now(),
    };
  }

  // 2. CURTIDA / LIKE
  if (tipo === 'like' || tipo === 'curtida') {
    const quantidadeLikes =
      dados.likeCount ??
      dados.count ??
      dados.likes ??
      dados.totalLikes ??
      1;

    return {
      tipo: 'like',
      ...infoUsuario,
      quantidade: Math.max(1, Number(quantidadeLikes)),
      timestamp: Date.now(),
    };
  }

  // 3. COMENTÁRIO DO CHAT
  if (tipo === 'comentario' || tipo === 'chat') {
    const textoComentario =
      dados.comment ??
      dados.text ??
      dados.commentText ??
      dados.content ??
      '';

    return {
      tipo: 'comentario',
      ...infoUsuario,
      comentario: limparTextoParaRoblox(textoComentario),
      timestamp: Date.now(),
    };
  }

  // 4. ENTRADA NA LIVE (MEMBER / JOIN)
  if (tipo === 'entrada' || tipo === 'member' || tipo === 'join') {
    return {
      tipo: 'entrada',
      ...infoUsuario,
      timestamp: Date.now(),
    };
  }

  // 5. SEGUIDOR (FOLLOW)
  if (tipo === 'follow' || tipo === 'seguidor') {
    return {
      tipo: 'follow',
      ...infoUsuario,
      timestamp: Date.now(),
    };
  }

  // Fallback para qualquer outro evento
  return {
    tipo,
    ...infoUsuario,
    timestamp: Date.now(),
  };
}
