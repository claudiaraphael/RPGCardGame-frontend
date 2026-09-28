# Frontend — RPGCardGame ("AuroraRPG")

Front do **RPGCardGame**, jogo de cartas de RPG inspirado em D&D 5e (MVP de
disciplina). HTML/CSS/JS puro, **sem bundler nem framework**, servido em
dev pela extensão Live Server do VS Code (`localhost:5500`/`127.0.0.1:5500`)
e consumindo o backend em `http://localhost:3000`. O contexto geral do
projeto (regra da disciplina, backend, D&D API) está em
[`../CLAUDE.md`](../CLAUDE.md); este arquivo é só sobre o front.

## O que já foi feito

O front passou por um redesign visual completo, batizado **"AuroraRPG"**
(paleta e tipografia definidas em `documentacao/landing_page_plan.md`),
substituindo a tela solta de seleção de personagem original por um
conjunto de páginas com visual unificado, todas puxando os mesmos
estilos base (`components/shared/`).

Nessa reorganização:

- **Uma pasta por página/componente** em `components/` (`shared/`,
  `landing/`, `login/`, `suporte/`, `bestiario/`), no lugar da divisão
  antiga por tipo de arquivo (`styles/` vs `scripts/` soltos na raiz).
- **`index.html`** virou a tela de Início + Personagens: header/nav
  padrão, hero "AuroraRPG: Chega em Breve!" e uma grade de cards de
  personagem com **CRUD completo** (criar, editar, excluir) contra
  `/personagens` do backend. Fica bloqueada (`gated-box`) se o usuário
  não estiver logado.
- **Login/registro** (`components/login/login.html`) e a sessão
  (token JWT + dados do usuário em `localStorage`) viraram um módulo
  compartilhado (`components/shared/session.js`), reaproveitado por toda
  página que precisa saber se tem alguém logado — antes cada página
  duplicava essa lógica.
- **Sistema de tickets** ganhou uma tela de verdade: a "Central de
  Suporte Arcano" (`components/suporte/suporte.html`), que era só um
  mockup com dado inventado, agora chama `POST /tickets` e
  `GET /tickets/me` do backend de verdade. Isso exigiu estender o backend
  (`backend/tickets/`) com um 4º tipo de ticket (`pedidos`) e um campo de
  prioridade (baixa/media/alta/critica), pra bater com o desenho da tela.
- **Índice de monstros** (`components/bestiario/monster-index.html`):
  busca, filtros por tipo/CR/tamanho/alinhamento (os chips de tipo são
  gerados em tempo real a partir dos dados carregados, não uma lista
  fixa), paginação no cliente, statblock completo por monstro, e retry
  automático dos itens que falharem no carregamento (evita que uma falha
  de rede pontual suma com uma categoria inteira do filtro).
- **Páginas antigas removidas** por terem sido superadas pelas de cima:
  a versão simples do índice de monstros (`monstros.html`/`.css`/`.js`),
  a versão simples de tickets (`tickets.html`/`.css`/`.js`), e o
  `style.css`/`script.js`/`login.css`/`login.js` soltos que existiam na
  raiz antes da reorganização.
- **Docker**: `Dockerfile` (nginx:alpine) atualizado pra copiar a pasta
  inteira (`COPY . .`) em vez de uma lista de arquivo por arquivo — assim
  não precisa editar o `Dockerfile` toda vez que uma página nova aparece.
  Imagem já buildada e testada, servindo todas as páginas atuais.

## Estrutura de pastas

```
frontend/
├── index.html                  # entrada (Início + Personagens) — fica na
│                                # raiz de propósito: nginx/Live Server
│                                # servem index.html como documento padrão
├── components/
│   ├── shared/                  # importado por toda página, nesta ordem
│   │   ├── tokens.css             # paleta oficial + tipografia
│   │   ├── base.css               # reset, fundo com orbs, header/nav/auth-bar
│   │   ├── components.css         # botões, inputs, pills, badges, cards
│   │   └── session.js             # token/usuário (localStorage), widget de auth do header
│   ├── landing/                 # só CSS/JS — o HTML é o index.html da raiz
│   │   ├── landing.css
│   │   └── personagens.js         # CRUD contra /personagens
│   ├── login/
│   │   ├── login.html
│   │   ├── login.css
│   │   └── login.js
│   ├── suporte/
│   │   ├── suporte.html           # Central de Suporte Arcano
│   │   ├── support.css
│   │   └── support.js             # POST /tickets + GET /tickets/me
│   └── bestiario/
│       ├── monster-index.html
│       ├── monster-index.css
│       ├── monster-index.js       # paginação, filtros, statblock
│       └── monster-api.js         # cliente com fallback + cache local
├── documentacao/                # notas de planejamento (paleta, mockups, plano) — não vai pra imagem Docker
├── Dockerfile / .dockerignore   # nginx:alpine, COPY . . — ver DOCKER.md
├── DOCKER.md                    # guia de Docker (cópia do da raiz do repo)
├── CLAUDE.md / to-do.md         # guia de contexto e checklist do front
└── claude-arquitetura.md        # conteúdo de outra conversa, sem relação com este projeto
```

## Páginas

| Página | O que faz | Consome do backend |
| --- | --- | --- |
| `index.html` | Início + gestão de personagens (CRUD) | `GET/POST/PUT/DELETE /personagens` |
| `components/login/login.html` | Entrar / criar conta | `POST /auth/login`, `POST /auth/register` |
| `components/suporte/suporte.html` | Abrir e ver os próprios tickets (feature, bug, suporte, pedidos) | `POST /tickets`, `GET /tickets/me` |
| `components/bestiario/monster-index.html` | Índice de monstros: busca, filtros, paginação, statblock | `GET /monsters`, `GET /monsters/:index` |

Nenhuma página fala direto com a D&D API externa — todas passam pelo
backend (`http://localhost:3000`), que valida o dado com Zod antes de
devolver.

## Rodando em desenvolvimento

1. Backend rodando (`cd ../backend && npm run dev`, sobe em `:3000`).
2. Abrir `frontend/index.html` com a extensão **Live Server** do VS Code
   (`localhost:5500` ou `127.0.0.1:5500` — o CORS do backend só libera
   essas duas origens).
3. Criar uma conta em `components/login/login.html` pra liberar a grade
   de personagens e a Central de Suporte (as duas exigem login).

## Docker

```bash
docker build -t rpgcardgame-frontend .
docker run -d --name rpgcardgame-frontend -p 5500:80 rpgcardgame-frontend
```

A porta **5500** importa: é a única (com `127.0.0.1:5500`) liberada no
CORS do backend (`backend/src/app.ts`). Guia completo — comandos de CLI,
como ler/editar o `Dockerfile`, solução de problemas — em
[`DOCKER.md`](DOCKER.md).

## Convenções e segurança

- URL base da API numa constante só (`API_BASE_URL`, definida em
  `components/shared/session.js` e reaproveitada por todo script que a
  carrega antes).
- Dado vindo da API ou do usuário vai pro DOM com
  `textContent`/`createElement`, nunca `innerHTML`.
- Sessão: JWT no header `Authorization: Bearer <token>`, token e usuário
  em `localStorage`, tudo via `components/shared/session.js` (fonte
  única — não duplicar em outro arquivo).
- Caminho relativo importa: um arquivo dentro de `components/<algo>/` usa
  `../` pra chegar em `components/shared/` ou na raiz.
- Não commitar `.env`, tokens ou senhas.

## Pontos de atenção / pendências

- **`claude-arquitetura.md`**: conteúdo colado de outra conversa (um
  design de MMO deckbuilder, sem relação com este projeto) — não foi
  tocado; considerar apagar.
- **Modelo de personagem é placeholder**: `index.html` usa só os campos
  que já existem no backend (nome/raça/classe/nível/hp/mp), não o modelo
  D&D completo do plano de redesign (alinhamento, AC, atributos) —
  decisão explícita pra não mexer em `backend/personagem/` por enquanto.
- **Remote do repositório antigo**
  (`C:\Users\claud\portfolio\JavaScript\RPGCardGame\`, o front começou lá
  antes de ser copiado pra cá): decidir se corrige ou abandona de vez.

Checklist completo e mais detalhado em [`to-do.md`](to-do.md) e
[`CLAUDE.md`](CLAUDE.md) (este último é o guia de contexto voltado pra
quem/o que vai mexer no código, não pro leitor humano do projeto).
