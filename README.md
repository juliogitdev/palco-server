# Palco 🎭

Ponte entre os presentes da sua live no **TikTok LIVE** e um jogo interativo no
**Roblox**. Quando alguém manda um presente, o Roblox faz um boneco com o nome da
pessoa aparecer, dançar e subir no ranking da live.

Este repositório é o **servidor** (Camadas 1 e 2 da arquitetura): ele capta os
eventos do TikTok, guarda numa fila, calcula o ranking e expõe uma API que o
Roblox consulta.

## Como funciona

```
TikTok LIVE  ->  captura  ->  fila + ranking  ->  API HTTP  ->  Roblox consulta a cada 1–2s
```

O Roblox não recebe conexões de fora: ele *consulta* este servidor. Por isso a API
usa um cursor — o jogo pergunta "o que aconteceu desde o ponto X?" e nunca processa
o mesmo presente duas vezes.

## Requisitos

- Node.js 20 ou superior
- Uma conta no TikTok que faça lives

## Instalação

```bash
git clone https://github.com/SEU_USUARIO/palco-server.git
cd palco-server
npm install
cp .env.example .env
# abra o .env e preencha TIKTOK_USERNAME e API_TOKEN
npm start
```

## Variáveis de ambiente (.env)

| Variável | Para que serve |
|---|---|
| `PORT` | Porta da API que o Roblox consulta (padrão 3000) |
| `TIKTOK_USERNAME` | Seu usuário do TikTok, sem @ |
| `API_TOKEN` | Token secreto que o Roblox envia no cabeçalho `Authorization` |
| `EULER_API_KEY` | (Opcional) chave da Euler Stream para limites maiores |
| `TOP_N` | Quantas posições o placar mostra |
| `TAMANHO_FILA` | Quantos eventos a fila guarda na memória |

## Endpoints

Todos, exceto `/health`, exigem o cabeçalho `Authorization: Bearer <API_TOKEN>`.

| Método | Rota | Retorna |
|---|---|---|
| GET | `/health` | Checagem de que o servidor está no ar |
| GET | `/events?desde=<cursor>` | Eventos novos + o novo cursor |
| GET | `/ranking` | Top N atual da live |

Exemplo de resposta de `/events`:

```json
{
  "eventos": [
    {
      "id": "evt_000123", "seq": 123, "tipo": "presente",
      "usuario": "maria", "apelido": "Maria",
      "presenteId": 5655, "presenteNome": "rosa",
      "valorMoedas": 1, "quantidade": 3, "timestamp": 1730900000000
    }
  ],
  "cursor": 123
}
```

## Mapa de presentes

O arquivo `config/presentes.json` liga cada presente a uma ação no jogo. Edite à
vontade sem tocar no código. Presente que não estiver na lista cai na ação `padrao`.

## Estrutura dos arquivos

```
palco-server/
├── src/
│   ├── index.js                 # ponto de entrada: liga tudo
│   ├── config.js                # lê e valida o .env
│   ├── captura/
│   │   ├── conexaoTikTok.js      # conecta na live (TikTok-Live-Connector)
│   │   └── normalizador.js       # evento cru -> Evento padrão
│   ├── nucleo/
│   │   ├── fila.js               # fila de eventos com cursor
│   │   ├── ranking.js            # acumula pontos e mantém o Top N
│   │   └── mapaPresentes.js      # carrega/consulta o mapa presente->ação
│   ├── api/
│   │   ├── servidor.js           # app Express + autenticação por token
│   │   └── rotas.js              # GET /events, GET /ranking
│   └── util/
│       └── logger.js             # log com data/hora
├── config/
│   └── presentes.json            # tabela presente -> ação (editável)
├── .env.example                  # modelo das variáveis de ambiente
├── .gitignore
├── package.json
├── LICENSE
└── README.md
```

## Aviso

A captação usa a biblioteca `tiktok-live-connector`, que acessa o TikTok de forma
**não-oficial** (engenharia reversa). Ela pode parar de funcionar quando o TikTok
muda seu protocolo interno. Os nomes exatos de eventos e campos podem variar
conforme a versão da biblioteca — confira a documentação dela se algum campo vier
vazio. Recompensas no jogo devem ser sempre visuais/simbólicas: prometer prêmio
real por presente esbarra nas regras de TikTok e Roblox.

## Licença

MIT
