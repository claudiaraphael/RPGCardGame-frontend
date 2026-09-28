# CLAUDE.md (frontend)

Guia de contexto só do front. O contexto geral do projeto (regras da
disciplina, backend, D&D API, Docker do backend) está em `../CLAUDE.md`.

## O que é

Front do **RPGCardGame** (MVP de disciplina, jogo de cartas de RPG inspirado
em D&D 5e). HTML/CSS/JS puro, **sem bundler**, servido em dev pela extensão
Live Server do VS Code em `localhost:5500`/`127.0.0.1:5500`. Consome o backend
em `http://localhost:3000`.

**Regra da disciplina: pelo menos 50% do código é da autora.** Prefira
explicar, revisar e apontar caminhos em vez de entregar HTML/CSS/JS prontos,
a menos que ela peça explicitamente. Comentários em português, com o *porquê*
de cada escolha.

## Estrutura: uma pasta por componente/página (2026-09-28)

```
frontend/
├── index.html                  # entrada (Início + Personagens) — fica na
│                                # raiz de propósito: nginx/Live Server
│                                # servem index.html como documento padrão,
│                                # mover pra dentro de components/ quebraria isso
├── components/
│   ├── shared/                  # importado por toda página
│   │   ├── tokens.css             # paleta oficial + tipografia
│   │   ├── base.css               # reset, fundo com orbs, header/nav/auth-bar
│   │   ├── components.css         # botões, inputs, pills, badges, cards
│   │   └── session.js             # token/usuário (localStorage), widget de auth do header
│   ├── landing/                 # só CSS — o HTML é o index.html da raiz
│   │   └── landing.css            # só o hero banner
│   ├── login/
│   │   ├── login.html
│   │   ├── login.css
│   │   └── login.js
│   ├── personagens/
│   │   ├── personagens.html       # grade de personagens + form criar/editar
│   │   ├── personagens.css
│   │   └── personagens.js         # CRUD contra /personagens
│   ├── suporte/
│   │   ├── suporte.html           # Central de Suporte Arcano
│   │   ├── support.css
│   │   └── support.js             # POST /tickets + GET /tickets/me
│   └── bestiario/
│       ├── monster-index.html
│       ├── monster-index.css
│       ├── monster-index.js       # paginação, filtros, statblock
│       └── monster-api.js         # cliente com fallback + cache local
├── documentacao/                # notas de planejamento (paleta, mockups, plano)
├── Dockerfile / .dockerignore
├── CLAUDE.md / to-do.md
└── claude-arquitetura.md        # ver "Pontos de atenção" abaixo
```

Cada CSS/JS de página importa/carrega `components/shared/*` primeiro
(`tokens.css` → `base.css` → `components.css` → CSS próprio da página), na
mesma ordem em toda página. Ver detalhe de cada uma em "Páginas" abaixo.

## Páginas

- **`index.html`** (Início): header padrão + hero "AuroraRPG: Chega em
  Breve!". Só isso — a gestão de personagens é página própria (abaixo).
- **`components/login/login.html`**: formulário de entrar/criar conta,
  usando `components/shared/session.js` (login/registrar) em vez de
  duplicar `localStorage` na mão. Depois de logar/criar conta, redireciona
  direto pra `components/personagens/personagens.html`
  (`DESTINO_APOS_LOGIN` em `login.js`).
- **`components/personagens/personagens.html`**: grade de cards de
  personagem (CRUD completo — criar, editar, excluir — contra
  `/personagens`). Campos são os placeholders reais do backend
  (nome/raca/classe/nivel/hp/mp), **não** o modelo D&D completo do plano
  de redesign (alinhamento/AC/atributos/retrato) — decisão explícita da
  autora pra não mexer em `backend/personagem/` por enquanto (o "retrato"
  do card é só a inicial do nome). Bloqueado (`gated-box`) se deslogado,
  com link pra `components/login/login.html`.
- **`components/suporte/suporte.html`** (Central de Suporte Arcano): liga
  em `POST /tickets` e `GET /tickets/me` de verdade (antes era mock, array
  fake e `POST /support` que não existia). `backend/tickets/` ganhou um 4º
  tipo (`pedidos`) e um campo `priority` (baixa/media/alta/critica) pra
  bater com o mockup — ver `backend/tickets/ticketSchema.ts`/`ticketRepository.ts`.
- **`components/bestiario/monster-index.html`**: busca, filtros (tipo/CR/
  tamanho/alinhamento gerados em runtime a partir do dataset carregado,
  não uma lista fixa), paginação client-side, statblock completo, retry
  automático dos monstros que falharem no carregamento. Consome
  `GET /monsters`/`GET /monsters/:index` do backend (que batem na D&D API
  externa a cada request).
- **Removidos nesta rodada** (superados pelas páginas acima, nada mais os
  referenciava): `tickets.html`/`.css`/`.js`, `monstros.html`/`.css`/`.js`,
  `style.css`/`script.js` da raiz, `login.css`/`login.js` antigos na raiz.

## Convenções e segurança

- URL base da API numa constante só (`API_BASE_URL`, definida em
  `components/shared/session.js` e reaproveitada por todo script que a
  carrega antes).
- Dado vindo da API/do usuário vai pro DOM com `textContent`/`createElement`,
  nunca `innerHTML`.
- Sessão/autenticação: JWT no header `Authorization: Bearer <token>`, token
  e usuário em `localStorage` (`components/shared/session.js` — única
  fonte, não duplicar em outro arquivo).
- Caminho relativo importa: um arquivo em `components/<algo>/` usa `../`
  pra chegar em `components/shared/` ou na raiz (`../../index.html`); veja
  o padrão já aplicado em `suporte.html`/`login.html`/`monster-index.html`
  antes de criar uma página nova.
- O CORS do backend usa lista fixa de origens; se o front mudar de origem
  (ex: container nginx), a origem nova precisa entrar em `../backend/src/app.ts`.
- Não commite `.env`, tokens ou senhas.

## Pontos de atenção

- **`claude-arquitetura.md`**: conteúdo colado de outra conversa (MMO
  deckbuilder com Redis/WebSockets, sem relação com este projeto) — não é
  tocado, mas vale a autora conferir se quer apagar.
- **`database.sqlite` local**: a extensão do schema de `tickets`
  (prioridade + tipo `pedidos`) foi migrada preservando os dados que já
  existiam (não precisou apagar o banco) — ver comentário em
  `backend/tickets/ticketRepository.ts` se isso precisar ser refeito numa
  outra máquina/checkout limpo.
- **Docker**: rebuild não confirmado nesta sessão (Docker Desktop fechado
  na máquina) — o `Dockerfile` usa `COPY . .`, não deveria precisar mudar
  por causa da reorganização em pastas, mas vale reconferir.

## Docker

```bash
docker build -t rpgcardgame-frontend .
docker run -p 8080:80 rpgcardgame-frontend
```

Lembrete: o `fetch` roda no navegador, então a URL do backend é
`localhost:3000` mesmo com o front em container.

## Ao usar Claude Code aqui

- Mudanças pequenas, sem framework, bundler ou abstrações "de produção".
- Sem testes automatizados: descreva no resumo o que foi verificado
  manualmente (ex: abrir no Live Server com o backend rodando).
- **Git (commit e push) é com a autora.** Nunca rode `git push` sem pedido
  explícito na mesma conversa.
