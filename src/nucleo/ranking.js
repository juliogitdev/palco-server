// Acumula pontos por usuario na sessao da live e mantem o Top N pronto.
// Atualizado na escrita (quando o presente chega), entao ler o placar e instantaneo.
export function criarRanking(topN = 3) {
  const pontosPorUsuario = new Map(); // usuario -> { apelido, pontos }

  return {
    registrar(usuario, apelido, pontos) {
      const atual = pontosPorUsuario.get(usuario) || { apelido, pontos: 0 };
      atual.apelido = apelido || atual.apelido;
      atual.pontos += pontos;
      pontosPorUsuario.set(usuario, atual);
    },

    top() {
      return [...pontosPorUsuario.values()]
        .sort((a, b) => b.pontos - a.pontos)
        .slice(0, topN)
        .map(({ apelido, pontos }) => ({ apelido, pontos }));
    },

    zerar() { pontosPorUsuario.clear(); },
  };
}
