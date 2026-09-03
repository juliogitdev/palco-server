// src/nucleo/fila.js
export function criarFila(tamanhoMax = 500) {
  let contador = 0;
  let eventos = [];

  return {
    adicionar(evento) {
      contador += 1;
      const registro = {
        ...evento,
        seq: contador,
        id: `evt_${String(contador).padStart(6, '0')}`,
      };
      eventos.push(registro);
      if (eventos.length > tamanhoMax) eventos = eventos.slice(-tamanhoMax);
      return registro;
    },

    desde(cursor = 0) {
      const novos = eventos.filter((e) => e.seq > cursor);
      const novoCursor = eventos.length ? eventos[eventos.length - 1].seq : cursor;

      const pendentesAposEnvio = Math.max(0, eventos.length - (novoCursor - cursor));
      
      return { 
        eventos: novos, 
        cursor: novoCursor,
        metricas: {
          tamanhoFilaTotal: eventos.length,
          entreguesNestaRequisicao: novos.length
        }
      };
    },

    limpar() {
      const totalDescartado = eventos.length;
      eventos = [];
      return { limpo: true, descartados: totalDescartado, ultimoSeq: contador };
    },
  };
}