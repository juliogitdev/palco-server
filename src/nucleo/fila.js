// Fila de eventos em memoria.
// Cada evento ganha um numero sequencial (seq). O Roblox consulta a partir de um
// cursor e nunca recebe o mesmo evento duas vezes, mesmo se uma consulta falhar.
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

    // Retorna eventos com seq > cursor. cursor = 0 traz tudo o que ha na fila.
    desde(cursor = 0) {
      const novos = eventos.filter((e) => e.seq > cursor);
      const novoCursor = eventos.length ? eventos[eventos.length - 1].seq : cursor;
      return { eventos: novos, cursor: novoCursor };
    },
  };
}
