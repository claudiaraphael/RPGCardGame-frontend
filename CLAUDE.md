# CLAUDE.md

Guia de contexto para quem (humano ou Claude Code) for trabalhar neste repositório.

## O que é este projeto

**RPGCardGame** é um projeto de estudo (MVP de uma disciplina): um jogo de cartas
de RPG inspirado em D&D 5e. O objetivo é praticar modelagem de dados, gerenciamento
de estado, depuração, design de fronteiras e raciocínio assíncrono, consumindo a API
pública [D&D 5e API](https://www.dnd5eapi.co/). O requerimento oficial está em
`backend/to-do/documentation/Requerimento_MVP.pdf`.

**Regra dos 50% (esclarecida em 2026-09-27): só vale pra quem usou um dos
exemplos citados no requerimento da disciplina.** Como este projeto é ideia
própria da autora (não um dos exemplos), a regra não se aplica aqui — ela
confirmou que está liberado implementar de verdade (não só esqueleto/
explicação) quando ela pedir. A faxina antiga (commit `796594d`, que
removeu uma arquitetura em camadas já montada) foi feita sob a leitura
anterior, mais cautelosa, da regra; não é preciso repetir esse cuidado daqui
pra frente. Ainda assim, **`auth/User.ts` e `Systems/Systems.js` continuam
sendo trabalho manual ativo da autora** (ver abaixo) — não avançar neles sem
pedido explícito é sobre não pisar no trabalho dela, não sobre a regra dos
50%.

Os comentários do código são em português e têm propósito didático (explicam
*por que* de cada escolha). Preserve esse tom ao editar.

## Estado atual do repositório

- **Servidor Express rodando** em `backend/src/` (`app.ts` + `server.ts` +
  `routes/`), expondo `GET /<entidade>` e `GET /<entidade>/:index` para as
  24 categorias da D&D API modeladas em `entidades-dnd/schemas/`. `npm run
  dev`/`npm start` funcionam (`npm start` corrigido — apontava pra
  `dist/server.js`, que nunca existiu, o real é `dist/src/server.js`,
  já que `rootDir` é `.` e `src/` é uma subpasta dele).
- **Autenticação por JWT** (`backend/auth/`: `authRoutes.ts`,
  `authService.ts`, `requireAuth.ts`, `userRepository.ts`,
  `passwordHash.ts` com `argon2`). Substituiu a sessão por cookie que
  existia antes — `express-session`/`bcrypt`/`sessionStore.ts` foram
  removidos. Access token só (`JWT_SECRET`, 15 min), sem refresh token
  (não tinha rota consumidora, foi tirado). Testado manualmente: fluxo
  completo de registro/login/rota protegida.
- **SQLite conectado** (`backend/db/connection.ts`, `better-sqlite3`,
  síncrono — ver comentário do arquivo pro porquê disso não ser um
  problema aqui). Guarda o **cache das 24 entidades da D&D API**
  (`backend/db/schema.ts`, tabela `dnd_cache`: uma linha por item —
  `entity_type`, `idx`, `data` como JSON, `updated_at`). Não é modelagem
  de jogo, é só espelho local da API externa pra não bater na rede a
  cada request. As 24 categorias já têm seed ligado (`db/runSeed.ts`,
  isolamento de falha por entidade — ver "Bugs" abaixo), mas **o
  `database.sqlite` local não é versionado** (gitignore) — se ele não
  existir ou estiver vazio numa máquina nova, rodar
  `npx ts-node db/runSeed.ts` de novo popula do zero (demora por bater
  na API externa pra cada um dos 2.027 itens).
- **As 24 entidades foram validadas contra dado real da API, de ponta a
  ponta** (2.027 itens, 0 falhas na última rodada). O resultado completo
  está versionado em `backend/to-do/documentation/dnd-full-data.json` —
  é a melhor fonte pra consultar o shape real de qualquer entidade antes
  de desenhar uma tabela ou um gerador de carta em cima dela. Esse
  processo já pegou e corrigiu dois bugs reais de schema (ver "Bugs já
  encontrados e corrigidos" abaixo).
- **Landing page do índice de monstros: implementada.** Só existe uma
  versão — `frontend/components/bestiario/monster-index.html` (a versão
  simples antiga, `monstros.html`/`.js`/`.css`, era um esboço descartável e
  foi removida). CSS/JS num arquivo por componente
  (`frontend/components/bestiario/monster-index.css`/`.js` +
  `monster-api.js`, o cliente da API), seguindo o mesmo padrão das outras
  páginas do front — uma pasta por página em `frontend/components/`, ver
  `frontend/CLAUDE.md`. Busca,
  filtros por tipo/CR/tamanho/alinhamento (chips de tipo gerados em
  runtime a partir dos dados carregados, não mais uma lista fixa
  incompleta no HTML), paginação client-side da tabela e statblock
  inteiro. Consome `GET /monsters` e `GET /monsters/:index` do backend,
  que batem na D&D API externa a cada request — **isso vale pra todas as
  24 entidades, não só monsters**: nenhuma rota em produção lê do
  `dnd_cache` hoje, que é escrito só pelo seed. Ligar as rotas ao cache é
  dívida técnica registrada, não resolvida ainda. `prefetchBatch()`
  (`monster-api.js`) tenta de novo índices que falharam na primeira
  passada antes de desistir, e a página avisa (com botão de retry manual)
  quando algum monstro não carrega — evita que categorias inteiras
  sumam do filtro por causa de uma falha de rede pontual e silenciosa.
- **CRUD de personagem implementado** (`backend/personagem/`:
  `personagemRoutes.ts`, `personagemRepository.ts`, `personagemSchema.ts`),
  registrado como `/personagens` em `app.ts`. Mesmo padrão de `auth/`:
  tabela própria no SQLite (`personagens`, `user_id REFERENCES users(id)`),
  Zod validando entrada, `requireAuth` em todas as rotas, dono sempre
  verificado por `req.auth.sub` (nunca por campo do corpo da requisição).
  Placeholder de campos (nome/raça/classe/nível/hp/mp) até o modelo real
  de personagem ser desenhado — trocar os campos não deve exigir mexer no
  resto do CRUD.
- **Autenticação/estado de jogo em construção pela autora, à mão**, em
  `backend/auth/User.ts` e `backend/Systems/Systems.js` (explorando
  um desenho tipo ECS — Entities/Components/Systems, irmã de `src/`, que
  é só o servidor HTTP). Não são esboços descartáveis como o antigo
  `auth/auth.js`: são trabalho ativo, em pseudocódigo por enquanto
  porque a autora está iterando — **não "corrija" a sintaxe nem
  prossiga esses arquivos sem pedido explícito**, é exatamente a parte
  que conta pros 50% dela.
  (Já existiu uma divergência aqui — um commit chegou a mover o arquivo
  pra `backend/src/Systems/`; foi revertida de volta pra
  `backend/Systems/`, que é a localização decidida.)
- **Guias de estudo próprios da autora** em
  `backend/to-do/documentation/estudos/`: `fundamentos-js-ts.md`,
  `gerencia-de-estado-com-classes.md`, `json-boas-praticas.md`,
  `decisao-app-server-systems.md` (raciocínio `app.ts`/`server.ts`
  aplicado ao ECS) e `refPersonagens.md` (tradução PT-BR do SRD, recorte
  focado em criação de personagem — raças, classes, antecedentes,
  talentos, perícias, equipamento, magias).
- **O frontend vive neste repositório, em `frontend/`**: HTML/CSS/JS puro
  sem bundler, servido em dev pela extensão Live Server do VS Code em
  `localhost:5500`/`127.0.0.1:5500`. Estrutura: `index.html` na raiz
  (entrada — precisa ficar aí, é o documento padrão do nginx/Live Server)
  + `components/` com uma pasta por página (`shared/`, `landing/`,
  `login/`, `suporte/`, `bestiario/`) — ver detalhe completo em
  `frontend/CLAUDE.md`. Também tem `Dockerfile` (nginx:alpine) e
  `to-do.md` (checklist do front). Ele começou num repo separado
  (`C:\Users\claud\portfolio\JavaScript\RPGCardGame\`, remote
  misconfigurado, nunca publicado) e foi copiado pra cá pra ficar no
  mesmo repositório público (exigência do requerimento); o repo antigo
  não é mais a referência. O `node_modules` dentro de `frontend/` é
  residual — ignore.

## Docker (testado e funcionando)

- **`backend/Dockerfile`** — build em 2 estágios, `node:24-bookworm-slim`
  — já buildado com sucesso e testado de ponta a ponta (`docker build` +
  `docker run` + `curl http://localhost:3000/spells/acid-arrow` devolvendo
  dado real). Comando completo documentado como comentário no topo do
  próprio `Dockerfile`.
- **Pegadinha real encontrada e corrigida**: `better-sqlite3` e `argon2`
  são módulos nativos (compilam via `node-gyp` no `npm ci`), e
  `node:24-bookworm-slim` não vem com Python/toolchain de build por
  padrão — sem isso o build falhava com `Could not find any Python
  installation`. Fix: `apt-get install python3 make g++` antes do
  `npm ci` nos dois estágios (removido de novo via `apt-get purge` no
  estágio final, pra não engordar a imagem).
- **`backend/Dockerfile` e `.dockerignore` são versionados direto**
  (2026-09-28, a pedido da autora — requisito da disciplina: o Dockerfile
  precisa estar no git dos dois projetos). Até então ficavam no
  `.gitignore` (variam com `docker init`) e só uma cópia em
  `backend/docker.exemple/` era versionada; esse espelho foi removido —
  não existe mais, não recriar.
- **`RUN touch .env`**: `process.loadEnvFile()` (em `auth/` e
  `entidades-dnd/`) lança erro se o arquivo não existe; `.env` real não
  vai pra imagem, as variáveis entram via `--env-file`.
- **SQLite via volume**: `db/connection.ts` grava em
  `dist/database.sqlite`; o Dockerfile faz esse caminho ser um symlink
  pra `/data/database.sqlite` (volume `-v rpg-data:/data`) — confirmado
  funcionando.
- **`tsconfig.json` exclui `to-do/`** do typecheck/build — tinha um
  rascunho de pseudocódigo (`to-do/documentation/Inventario/Inventario.ts`)
  que quebrava `npm run build` dentro do container.
- **Frontend também buildado e testado (2026-09-27)**: `frontend/Dockerfile`
  trocou de `COPY <lista de arquivos>` pra `COPY . .` (o front ganha
  página nova com frequência; allowlist manual precisaria de edição toda
  hora) + `.dockerignore` mais completo (fora da imagem: notas internas
  como `documentacao/`, `to-do.md`, `CLAUDE.md`, e ferramental local como
  `.vscode/`, `.claude/`). Testado servindo `index.html`,
  `indexMonstros/monster-index.html`, `login.html`, `tickets.html` e
  `suporte/suporte.html` (paths de antes da reorganização em
  `components/` — ver abaixo), todos `200`; arquivos internos confirmados
  fora (`404`). CORS entre os dois containers dockerizados testado e
  funcionando (`localhost:5500` → `localhost:3000`). **Pendente**:
  rebuild/reteste depois da reorganização do front em
  `frontend/components/` (2026-09-28) — `COPY . .` não deveria exigir
  mudança no `Dockerfile`, mas não foi confirmado (Docker Desktop estava
  fechado). `tickets.html` não existe mais (rota absorvida por
  `suporte/suporte.html`, hoje em `components/suporte/`).
- **Backend rebuildado com as rotas/deps desta sessão** (helmet,
  express-rate-limit, `/tickets`, `/admin`) e re-testado.
- **Sem `docker-compose` neste projeto — decisão explícita da autora**
  (duas imagens independentes, `docker build`+`docker run` cada uma; o
  `fetch` roda no navegador, que já enxerga as duas portas do host, então
  não há necessidade de rede compartilhada). Não sugerir compose de novo
  sem pedido explícito dela.
- **Guia completo de uso do Docker neste projeto**: `DOCKER.md` (raiz) —
  build/run passo a passo, comandos de CLI do dia a dia, como ler/editar
  um `Dockerfile` (inclusive por que o backend é 2 estágios e o front só
  1), e solução de problemas comuns.

## MVP v2 — admin, erro/segurança, tickets (concluído em 2026-09-27)

Landing page do monster-index, CRUD de personagem e a rodada abaixo já
entregues (ver "Estado atual" acima). A pedido explícito da autora:

- **Camada de erro**: `backend/src/errors/AppError.ts` (erro com
  `statusCode`+`message` pra casos esperados) e `asyncHandler.ts`
  (wrapper de rota assíncrona, evita repetir `try/catch`). Usados só nas
  rotas novas (tickets/admin) — `authRoutes.ts`/`personagemRoutes.ts`
  não são tocados sem pedido.
- **Camada de segurança**: `helmet` (headers) e `express-rate-limit`
  (limita `/auth/login` e `/auth/register` contra força bruta) —
  dependências novas, `npm audit` depois de instalar.
- **Camada de admin**: `role` (`"user"|"admin"`) já existe na tabela
  `users` e no payload do JWT (`requireAuth.ts` já decodifica).
  `requireAdmin.ts` (middleware) e `promoteToAdmin.ts` (script
  `ts-node`, sem rota HTTP — evita autopromoção) fecham a peça que
  faltava.
- **Sistema de tickets** (`backend/tickets/`): mesmo padrão de
  `personagem/` — `ticketRepository.ts`/`ticketSchema.ts`/
  `ticketRoutes.ts`. Tipos: `feature`, `bug`, `support`, `pedidos` (esse
  último e o campo `priority` foram acrescentados depois, pra bater com o
  mockup da "Central de Suporte Arcano" em `frontend/documentacao/`) —
  migração feita preservando os dados que já existiam no
  `database.sqlite` local (ver comentário em `ticketRepository.ts`).
  Usuário cria e vê os próprios; admin vê/atualiza todos. Front:
  `frontend/components/login/login.html` (tela de entrar/criar conta) +
  `frontend/components/suporte/suporte.html` (Central de Suporte Arcano —
  única tela de tickets hoje; a versão simples antiga, `tickets.html`,
  era um esboço redundante e foi removida). `suporte.html` já consome de
  verdade `POST /tickets`/`GET /tickets/me`.
- **Docker**: as duas imagens (backend e frontend) buildadas, rodando e
  testadas — ver seção "Docker" acima e `DOCKER.md` (raiz) pro guia
  completo. Sem `docker-compose` — decisão explícita da autora.

## Bugs já encontrados e corrigidos (via validação contra dado real)

Vale registrar como exemplo de depuração sistemática (skill central do
projeto, ver `to-do/todo.md`):

1. **`dc` de spell** (`entidades-dnd/schemas/spells.schema.ts`): o
   `DcSchema` compartilhado tem o formato de monstro (`dc_value` +
   `success_type`). Spell usa `dc_success` e não tem `dc_value` nenhum —
   só foi pego rodando o seed contra as 319 spells de verdade, porque o
   exemplo original (`acid-arrow`) não tinha campo `dc`. Fix: schema
   próprio `SpellDcSchema` só pra spell.
2. **`option_type: "multiple"`** (`entidades-dnd/schemas/shared.schema.ts`,
   `OptionSchema`): faltava essa variante (uma opção de equipamento que é
   combo de dois itens juntos, ex: "besta leve + 20 virotes"). Sem ela, 6
   das 12 classes falhavam a validação (`cleric`, `fighter`, `paladin`,
   `rogue`, `sorcerer`, `warlock`). Também achado nesse processo: o campo
   `prerequisites` (pré-requisito de proficiência pra escolher um item)
   era descartado em silêncio pelo modo "strip" padrão do Zod — agora é
   modelado explicitamente.
3. **`npm start` apontava pro arquivo errado** (`package.json`):
   `node dist/server.js`, que nunca existiu — o `tsconfig.json` tem
   `rootDir: "."` e `outDir: "./dist"`, então `src/server.ts` compila pra
   `dist/src/server.js`, não `dist/server.js`. Só não foi notado antes
   porque o dia a dia usa `npm run dev` (`ts-node` direto, sem passar por
   `dist/`); só apareceu testando o Dockerfile, que já usava o caminho
   certo (`CMD ["node", "dist/src/server.js"]`).

## Estrutura

```
RPGCardGame/
├── package.json / package-lock.json   # dependência raiz "card-factory" (a confirmar a origem)
├── backend/
│   ├── src/
│   │   ├── app.ts             # Express: CORS, rotas de auth + entidades, error handler
│   │   ├── server.ts          # só importa app.ts e liga na porta 3000
│   │   └── routes/
│   │       ├── entityRouter.ts  # fábrica genérica: GET / e GET /:index pra qualquer entidade
│   │       └── index.ts         # registra as 24 entidades nessa fábrica
│   ├── Systems/
│   │   └── Systems.js         # exploração de arquitetura ECS — trabalho da autora, irmã de src/ (não é parte do servidor HTTP)
│   ├── db/
│   │   ├── connection.ts      # abre o SQLite (better-sqlite3), WAL + foreign_keys ligados
│   │   ├── schema.ts          # CREATE TABLE dnd_cache (cache da API externa)
│   │   ├── seedDndCache.ts    # seedEntity()/withRetry() genéricos, populam dnd_cache
│   │   └── runSeed.ts         # roda o seed pras 24 entidades, isolando falha por entidade
│   ├── testes/
│   │   └── README.md          # notas sobre testabilidade (app.ts/server.ts), sem testes de verdade ainda
│   ├── seed.ts                # funções axios que consultam a D&D API (spells) + todos de modelagem
│   ├── dado/
│   │   └── d20.ts             # rolagem de d20
│   ├── personagem/
│   │   └── interface_personagem.ts   # interface Personagem (esboço)
│   ├── entidades-dnd/
│   │   ├── dnd-api-client.ts  # fetchFromDndApi<T>(path): cliente axios genérico
│   │   └── schemas/*.schema.ts # um schema Zod por categoria da D&D API (spells, monsters, classes...)
│   ├── auth/
│   │   ├── auth.js            # esboço antigo, não funcional — não confundir com o resto de auth/
│   │   ├── authRoutes.ts / authService.ts / authTypes.ts / requireAuth.ts / userRepository.ts / passwordHash.ts
│   │   │                       # auth JWT (registro/login/rota protegida), funcional e testada
│   │   └── User.ts             # modelagem de User/Character/Party em construção pela autora — não tocar
│   ├── to-do/
│   │   ├── todo.md            # checklist de próximos passos
│   │   ├── Requerimento_MVP.pdf
│   │   └── documentation/
│   │       ├── dnd-full-data.json   # dump completo e validado das 24 entidades (2.027 itens) — fonte de referência rica pro shape real de qualquer entidade
│   │       ├── estudos/              # guias de estudo próprios da autora (ver "Estado atual" acima)
│   │       └── ...             # mapas da API, quickstart, código de referência antigo
│   ├── Dockerfile / .dockerignore  # versionados direto (sem espelho — ver "Docker" acima)
│   ├── .env                   # DND_BASE_URL + JWT_SECRET (URL pública + segredo local, sem valor real no git)
│   ├── tsconfig.json          # rootDir "." e include "**/*.ts", exclude ["node_modules","dist","to-do"]
│   └── package.json
```

## Stack

- **Backend**: Node.js + TypeScript (strict), `express` 5, `cors`,
  `better-sqlite3`, `jsonwebtoken`, `argon2`, `axios`, `zod` 4.
  Dependências de Swagger e `zod-to-openapi` continuam no `package.json`,
  mas hoje nada as usa (sobra do código arquivado; reservadas para quando
  a documentação interativa entrar, provavelmente perto da entrega/vídeo).
- **Frontend**: `frontend/` (HTML/CSS/JS puro, ver "Estado atual").
- **D&D API**: REST sem autenticação, base `DND_BASE_URL` + `/api/2014/...`.

## Comandos

Dentro de `backend/`:

```bash
npx tsc --noEmit          # checa os tipos sem gerar arquivos
npm run build              # tsc -> dist/
npm run dev                 # nodemon + ts-node src/server.ts -> http://localhost:3000
npm start                    # node dist/src/server.js (rodar depois de npm run build)
npx ts-node db/runSeed.ts     # popula dnd_cache (24 entidades) a partir da D&D API
```

Docker (testado, ver seção própria acima):

```bash
docker build -t rpgcardgame-backend .
docker run --env-file .env -p 3000:3000 -v rpg-data:/data rpgcardgame-backend
```

Para rodar um arquivo isolado (ex: `seed.ts`, que não faz parte do servidor —
é um script avulso), use `npx ts-node <arquivo>`.

## Variáveis de ambiente e segurança

- `backend/.env` define `DND_BASE_URL` (URL pública da D&D API) e
  `JWT_SECRET` (assina o access token — gerado localmente, nenhum valor
  real deve ir pro git ou pra docs). Não tem mais `SESSION_SECRET`
  (sessão por cookie foi removida) nem `JWT_REFRESH_SECRET` (refresh
  token removido por não ter rota consumidora).
- **`.env` não é mais rastreado pelo git** (`git rm --cached` rodado em
  `e56598a`). Continua existindo no disco normalmente — `npm run dev`,
  seed etc. seguem funcionando. O `.env` que ficou nos commits antigos
  (`e28ffe0`/`3b3565a`) só tinha `DND_BASE_URL`, sem segredo — decisão
  consciente de não reescrever histórico pra isso (custo alto: mexeria
  em 5 branches; ver conversa/commit pra contexto se precisar revisitar).
- **Não adicione variáveis novas ao `.env` sem pedido explícito.**
- Nunca imprima, cole em documentação ou commite valores de `.env`, tokens,
  senhas ou strings de conexão. Em docs, use placeholders.
- Valide com Zod tudo que vem de fora (respostas da D&D API, `req.body`) antes de
  usar. Não interpole entrada de usuário em caminhos de URL sem
  `encodeURIComponent` — em `seed.ts`, `getSpellByName`/`getSpellByIndex` montam
  a URL com o valor cru (ainda não corrigido ali; as rotas em
  `src/routes/entityRouter.ts` já aplicam `encodeURIComponent` no `:index`).
- CORS em `src/app.ts` usa `origin` explícito (lista fixa com as URLs do Live
  Server) — nunca `origin: "*"`/`true`. Sem `credentials: true` desde que a
  sessão por cookie saiu: o JWT vai no header `Authorization: Bearer <token>`,
  não em cookie, então não precisa de credenciais cross-origin.
- Ao adicionar dependências, confira nome e origem do pacote (risco de
  typosquatting) e rode `npm audit`.
- O error handler central em `src/app.ts` nunca expõe stack trace ao cliente.

## Convenções e pontos de atenção

- **Zod como fonte única de verdade**: um schema Zod define validação e tipo
  TypeScript (`z.infer`). Os schemas em `entidades-dnd/schemas/` seguem isso,
  e cada um exporta o mesmo par de funções assíncronas (`getXList`,
  `getXByIndex`) — é esse padrão uniforme que permite tanto a fábrica de
  rotas (`entityRouter.ts`) quanto o `seedEntity()` genérico em
  `db/seedDndCache.ts`.
- **`app.ts` e `server.ts` ficam separados de propósito** — ver
  `backend/testes/README.md`.
- **`seed.ts` (raiz) não é parte do servidor**: script avulso, ainda sem
  Zod nem gravação em banco. Diferente de `db/seedDndCache.ts` +
  `db/runSeed.ts`, que já gravam de verdade em `dnd_cache` (só spells por
  enquanto). Não confundir nenhum dos dois com `dist/seed.js`, que é só
  compilado.
- **`dnd_cache` é cache, não modelagem de jogo**: as tabelas de
  personagem/carta/deck/mão/combate são modelagem original da autora
  (ver `auth/User.ts`, `Systems/Systems.js`) e ainda não têm tabela no
  SQLite — só o cache da API externa tem, até agora.
- **Vários pontos são esboços intencionais**: `criarPersonagem` lança
  "Implementar criação do personagem", `seed.ts` (raiz) tem `todo`s de
  modelagem, `getSpellByName`/`getSpellByIndex` em `seed.ts` fazem a
  mesma requisição, `auth/auth.js` é esboço antigo não funcional,
  `to-do/documentation/Inventario/Inventario.ts` é pseudocódigo que não
  compila de propósito (por isso excluído do `tsconfig.json`).
  `auth/User.ts` e `Systems/Systems.js` são trabalho ativo da autora,
  não esboços descartáveis — não "corrigir" sem pedido explícito.
- **Sem testes automatizados.** `npm test` só imprime um erro proposital.

## Ao usar Claude Code neste repo

- Mudanças pequenas, coerentes com o estágio de aprendizado; nada de abstrações
  "de produção" (DI, camadas extras) sem pedido. A fábrica de rotas e o
  `seedEntity()` genérico são exceções justificadas: mesmo formato exato
  repetido 24 vezes, não abstração especulativa.
- Respeite a regra dos 50% de código próprio — em especial, não avance
  `auth/User.ts`/`Systems/Systems.js` sem pedido explícito, é trabalho
  ativo da autora.
- Ao mexer no backend, rode `npx tsc --noEmit` em `backend/`.
- Não há suíte de testes: no resumo final, descreva o que foi verificado
  manualmente (ex: subir o servidor com `ts-node` e testar rotas com `curl`)
  em vez de assumir sucesso.
- Antes de commitar, confira `git status`/`git diff` para não incluir `.env`,
  `node_modules`, `dist` ou o `database.sqlite` gerado localmente.
- **Nunca rode `git push` sem pedido explícito nessa mesma conversa** — a
  autora prefere fazer o push ela mesma. Commits locais são normais.
