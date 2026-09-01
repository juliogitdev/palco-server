import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Carrega e consulta o mapa presente -> acao (config/presentes.json).
const aqui = dirname(fileURLToPath(import.meta.url));
const caminho = join(aqui, '../../config/presentes.json');

let mapa = {};

export function carregarMapa() {
  mapa = JSON.parse(readFileSync(caminho, 'utf-8'));
  return mapa;
}

export function acaoDoPresente(presenteId) {
  return mapa[String(presenteId)] || mapa.padrao;
}
