// Log simples com data/hora, para acompanhar a live pelo terminal.
function ts() { return new Date().toISOString(); }

export const log = {
  info: (...a) => console.log(`[${ts()}] [info]`, ...a),
  aviso: (...a) => console.warn(`[${ts()}] [aviso]`, ...a),
  erro: (...a) => console.error(`[${ts()}] [erro]`, ...a),
};
