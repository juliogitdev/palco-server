// src/config.js
import 'dotenv/config';

export const config = {
  porta: Number(process.env.PORT) || 3000,
  tiktokUsername: process.env.TIKTOK_USERNAME || '',
  apiToken: process.env.API_TOKEN || '',
  tikToolApiKey: process.env.TIKTOOL_API_KEY || '',
  topN: Number(process.env.TOP_N) || 3,
  tamanhoFila: Number(process.env.TAMANHO_FILA) || 500,
  multiplicadorPadrao: Number(process.env.MULTIPLICADOR_PADRAO) || 1.0,
};

export function validarConfig() {
  const faltando = [];
  if (!config.apiToken) faltando.push('API_TOKEN');
  if (!config.tikToolApiKey) faltando.push('TIKTOOL_API_KEY');

  if (faltando.length) {
    throw new Error(
      `Variáveis faltando: ${faltando.join(', ')}. Copie .env.example para .env e preencha.`,
    );
  }
}