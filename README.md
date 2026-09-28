# 🐉 RPG Card Game

Um jogo de cartas de RPG inspirado em D&D 5e, construído em **Node.js +
TypeScript**, consumindo a [D&D 5e API](https://www.dnd5eapi.co/) como fonte
de dados. Projeto de estudo (MVP de disciplina), focado em praticar
modelagem de dados, gerenciamento de estado, depuração sistemática, design
de fronteiras arquiteturais e raciocínio assíncrono — skills que ferramentas
de IA não substituem, só apoiam.

> **RPGCardGame é conteúdo de fã não oficial (unofficial Fan Content), sem
> qualquer afiliação com a Wizards of the Coast.** Feito em conformidade com
> a [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy)
> da Wizards of the Coast. Não usa nenhuma logo/marca da Wizards of the Coast,
> não é vendido nem licenciado a terceiros, e a mecânica de D&D 5e usada vem
> do [SRD](https://www.dnd5eapi.co/) sob Open Game Content.

## O que já funciona

- ✅ **API REST completa para as 24 categorias da D&D API** (spells,
  monsters, classes, races, equipment e mais 19) — cada uma com
  `GET /<entidade>` e `GET /<entidade>/:index`, todas validadas por Zod.
- ✅ **As 24 entidades foram validadas de ponta a ponta contra a API real**
  (2.027 itens, 0 falhas). O resultado completo está versionado em
  [`backend/to-do/documentation/dnd-full-data.json`](backend/to-do/documentation/dnd-full-data.json)
  — é uma base de referência rica: todo o shape real de cada categoria da
  D&D API, já validado, num arquivo só, sem precisar bater na rede de novo
  pra consultar.
- ✅ **SQLite conectado** (`better-sqlite3`), guardando usuários, personagens
  e um cache local das entidades da D&D API (`dnd_cache` — hoje só
  alimentado pelo seed; nenhuma rota em produção lê dele ainda, ver
  "Arquitetura" abaixo).
- ✅ **Autenticação por JWT** (`POST /auth/register`, `POST /auth/login`,
  `GET /auth/me`) — token vai no header `Authorization: Bearer`, sem
  cookie nem sessão.
- ✅ **CORS com origem explícita** para o front rodar em `localhost:5500`
  (Live Server) consumindo a API em `localhost:3000`.
- ✅ **CRUD de personagem** (`/personagens`, atrás de login — cada usuário
  só vê/edita os próprios, dono verificado pelo token, nunca por campo do
  corpo da requisição).
- 🚧 Estados de jogo (deck, carta, mão, combate) ainda em construção — ver
  [`backend/to-do/todo.md`](backend/to-do/todo.md) pro roadmap completo.

## Arquitetura

```
frontend/ (mesmo repo, Live Server :5500)
   │  fetch (JSON — JWT no header Authorization quando autenticado, sem cookie)
   ▼
backend/src/app.ts (Express, :3000)
   ├─ /auth/*         → auth/authRoutes.ts (registro/login, JWT)
   ├─ /personagens/*  → personagem/personagemRoutes.ts (CRUD, dono = req.auth.sub)
   └─ /<24 entidades> → entidades-dnd/schemas/*.schema.ts
                            │
                            ▼
                   fetchFromDndApi (axios) ──▶ D&D 5e API externa
                   https://www.dnd5eapi.co — chamada a cada request,
                   pras 24 entidades (não só monsters), sem passar
                   pelo dnd_cache (SQLite)
```

O front nunca fala direto com a D&D API — só com este backend, que
consulta a D&D API por trás (pra qualquer uma das 24 entidades, a cada
request) e devolve dado já validado por Zod.

## O que tem aqui dentro

```
backend/
├── src/
│   ├── app.ts                # Express: CORS, rotas, error handler central
│   ├── server.ts              # liga o app.ts na porta 3000
│   └── routes/
│       ├── entityRouter.ts    # fábrica genérica: GET / e GET /:index por entidade
│       └── index.ts           # registra as 24 entidades da D&D API nessa fábrica
├── db/
│   ├── connection.ts          # conexão SQLite (better-sqlite3)
│   ├── schema.ts               # tabela dnd_cache (cache da API externa)
│   ├── seedDndCache.ts          # popula o cache, com retry
│   └── runSeed.ts                # roda o seed (spells já ligado)
├── auth/                       # registro/login/JWT (authRoutes, authService,
│                                # requireAuth, userRepository, passwordHash)
├── personagem/                  # CRUD de personagem: personagemRoutes.ts,
│                                # personagemRepository.ts, personagemSchema.ts
│                                # (atrás de login, dono = req.auth.sub)
├── entidades-dnd/
│   ├── dnd-api-client.ts       # cliente axios genérico pra D&D API
│   └── schemas/                # um schema Zod por categoria (spells, monsters, classes...)
├── testes/                     # notas de design pra quando testes automatizados entrarem
├── dado/d20.ts                  # rolagem de d20
├── Systems/Systems.js            # exploração de arquitetura ECS (em construção pela autora)
└── to-do/
    ├── todo.md                   # roadmap completo
    └── documentation/
        └── dnd-full-data.json     # dump completo e validado das 24 entidades

frontend/                       # HTML/CSS/JS puro, sem bundler (Live Server :5500)
├── index.html                  # Início + CRUD de personagem (redesign "AuroraRPG")
└── components/                  # uma pasta por página, ver frontend/CLAUDE.md
    ├── shared/                    # tokens/base/components.css + session.js
    ├── landing/                   # CSS/JS do index.html
    ├── login/
    ├── suporte/                   # Central de Suporte Arcano (/tickets)
    └── bestiario/
        └── monster-index.html      # busca, filtros completos, paginação, statblock
```

## Pré-requisitos

- [Node.js](https://nodejs.org/) 20.6+ (usa `process.loadEnvFile`) e `npm`

## Instalação

```bash
cd backend
npm install
```

Copie `backend/.env.example` para `backend/.env` e preencha:

- `DND_BASE_URL` — URL pública da D&D API (`https://www.dnd5eapi.co`)
- `JWT_SECRET` — qualquer string longa e aleatória local, usada só pra
  assinar os access tokens (não precisa ser a mesma em cada máquina)

## Rodando o servidor

```bash
npm run dev
```

Sobe em `http://localhost:3000`. Rotas disponíveis (uma por entidade da D&D
API):

```
ability-scores, alignments, backgrounds, classes, conditions, damage-types,
equipment, equipment-categories, feats, features, languages, magic-items,
magic-schools, monsters, proficiencies, races, rule-sections, rules, skills,
spells, subclasses, subraces, traits, weapon-properties
```

Cada uma expõe `GET /<entidade>` (lista resumida) e `GET /<entidade>/:index`
(item completo) — por exemplo:

```bash
curl http://localhost:3000/monsters/aboleth
curl http://localhost:3000/spells/acid-arrow
curl http://localhost:3000/classes/cleric
```

Toda resposta já passou pelo schema Zod da entidade correspondente antes de
sair pro cliente.

## Populando o banco local

```bash
npx ts-node db/runSeed.ts
```

Busca a entidade na D&D API, valida cada item e grava em `dnd_cache`
(SQLite). Hoje cobre `spells` (319 itens); estender pra outra entidade é
uma chamada a mais em `db/runSeed.ts`, reaproveitando o mesmo par
`getXList`/`getXByIndex` que já existe em `entidades-dnd/schemas/`.

## Docker (guia rápido — caminho feliz)

> ✅ **Status:** as duas imagens (backend e frontend) já foram buildadas e
> testadas de ponta a ponta. **Sem `docker-compose`** — decisão do
> projeto: duas imagens independentes, cada uma com seu próprio
> `docker build`/`docker run`. Guia completo (comandos de CLI do dia a
> dia, como ler/editar um `Dockerfile`, solução de problemas) em
> [`DOCKER.md`](DOCKER.md).

Pré-requisito: Docker Desktop **aberto e rodando**.

**Variáveis de ambiente** — o `.env` real não vai pro git nem pra imagem, então
quem for rodar precisa criar o próprio. Em `backend/`:

```bash
cp .env.example .env
```

| Variável       | O que é                                                | Valor                                                                 |
| -------------- | ------------------------------------------------------ | --------------------------------------------------------------------- |
| `DND_BASE_URL` | URL pública da D&D API (sem autenticação)              | `https://www.dnd5eapi.co` (já vem certo no `.env.example`)            |
| `JWT_SECRET`   | Segredo que assina os tokens de login (JWT)            | Qualquer string longa e aleatória — **troque** o placeholder do exemplo |

Pra gerar um `JWT_SECRET` decente:
`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
Só essas duas variáveis são necessárias; nenhuma chave de API externa.

**Backend** (dentro de `backend/`, com o `.env` acima pronto):

```bash
docker build -t rpgcardgame-backend .
docker run --env-file .env -p 3000:3000 -v rpg-data:/data rpgcardgame-backend
```

Teste: `curl http://localhost:3000/spells`. O banco SQLite fica no volume
`rpg-data` (sobrevive a recriar o container). Pra popular o cache dentro do
container em execução:
`docker exec <container> node dist/db/runSeed.js`.

**Frontend** (dentro do repo do front, que tem o próprio `Dockerfile` com
nginx servindo os arquivos estáticos):

```bash
docker build -t rpgcardgame-frontend .
docker run -p 5500:80 rpgcardgame-frontend
```

Abra `http://localhost:5500`. A porta **5500** importa: o CORS do backend só
libera `localhost:5500` e `127.0.0.1:5500`.

Mais detalhes (comandos de `docker ps`/`logs`/`exec`, como ler um
`Dockerfile`, o que fazer se uma porta já estiver em uso etc.) em
[`DOCKER.md`](DOCKER.md).

## Checando os tipos

```bash
npx tsc --noEmit
```

## Scripts do backend

| Comando | Situação |
| --- | --- |
| `npx tsc --noEmit` | ✅ checa os tipos |
| `npm run build` | ✅ compila para `dist/` |
| `npm run dev` | ✅ nodemon + ts-node `src/server.ts` → `http://localhost:3000` |
| `npm start` | ✅ `node dist/src/server.js` (rodar depois de `npm run build`) |
| `npx ts-node db/runSeed.ts` | ✅ popula o SQLite a partir da D&D API |

## Ferramentas de desenvolvimento

- **Figma via MCP**: servidor MCP oficial do Figma
  (`https://mcp.figma.com/mcp`) adicionado ao Claude Code como servidor HTTP,
  pra consultar/gerar a partir de arquivos e frames do Figma direto na
  conversa. Exige autenticação (`/mcp` no Claude Code, escolher `figma` e
  logar no navegador); a config fica local (`.claude.json`), não versionada.

## Segurança

- Segredos (inclusive `JWT_SECRET`) ficam só em `backend/.env`, fora do
  git (`.gitignore` cobre `.env`, `*.env.*` e o `database.sqlite` gerado
  localmente).
- CORS com origem explícita, nunca `*`. Sem `credentials: true` — o JWT vai
  no header `Authorization`, não em cookie, então não precisa de CORS com
  credenciais.
- Senhas com `argon2`; access token JWT de 15 min, sem refresh token.
- Todo dado vindo da API externa é validado com Zod antes de ser devolvido
  ou persistido.
- Error handler central nunca expõe stack trace ao cliente.
- Limite de tamanho de body (`express.json({ limit: "100kb" })`).

## Próximos passos

Roadmap completo em [`backend/to-do/todo.md`](backend/to-do/todo.md). Em
resumo, o que falta:

1. camada de admin (`role` já existe no usuário e no JWT, falta o
   middleware e as rotas que usam isso);
2. sistema de tickets (sugestão de feature, bug, suporte);
3. estender o seed pras outras 23 entidades (hoje só `spells` está no banco)
   e decidir se as rotas passam a ler do `dnd_cache`;
4. gerador de cartas a partir dos dados já validados da D&D API;
5. nova UI do front consumindo a API de ponta a ponta (login, personagem,
   tickets, estado do jogo, combate);
6. vídeo de entrega.

## Documentação extra

Em `backend/to-do/documentation/`:

- **`dnd-full-data.json`** — dump completo e validado das 24 categorias da
  D&D API (2.027 itens). A referência mais confiável pro shape real de
  qualquer entidade, sem precisar consultar a API de novo.
- `Mapa dos Dados de D&D5e.md` — shape das respostas de cada categoria (lista + exemplo)
- `dnd5e-api-mapping.md` e `dnd_api_requests.json` — notas e exemplos de requisições
- `codigo-referencia-antigo.md` — código arquivado do CRUD de `/cards`, base pro esqueleto atual de `src/`

Em `backend/testes/README.md`: por que `app.ts`/`server.ts` são separados e
como isso vai ser usado quando testes automatizados entrarem.

## API externa utilizada

[D&D 5e API](https://www.dnd5eapi.co/) — pública, sem autenticação nem
cadastro, licença aberta (dados de SRD 5.1, ver [dnd5eapi.co/docs/legal](https://5e-bits.github.io/docs/legal)).
Rotas consumidas: as 24 listadas acima, sob `/api/2014/`.
