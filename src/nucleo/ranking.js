// src/nucleo/ranking.js
export function criarRanking(topN = 10, duracaoCicloMinutos = 30) {
  let rankingMap = new Map(); // usuario -> { apelido, aura }
  let proximoReset = Date.now() + duracaoCicloMinutos * 60 * 1000;

  return {
    registrar(usuario, apelido, auraGanhas) {
      const atual = rankingMap.get(usuario) || { apelido, aura: 0 };
      atual.apelido = apelido || atual.apelido;
      atual.aura += auraGanhas;
      rankingMap.set(usuario, atual);
      return atual.aura; // Retorna o total acumulado atualizado
    },

    obterAura(usuario) {
      return rankingMap.get(usuario)?.aura || 0;
    },

    top() {
      return [...rankingMap.values()]
        .sort((a, b) => b.aura - a.aura)
        .slice(0, topN)
        .map(({ apelido, aura }) => ({ apelido, aura }));
    },

    tempoRestanteSegundos() {
      return Math.max(0, Math.floor((proximoReset - Date.now()) / 1000));
    },

    zerar() {
      rankingMap.clear();
      proximoReset = Date.now() + duracaoCicloMinutos * 60 * 1000;
    },
  };
}