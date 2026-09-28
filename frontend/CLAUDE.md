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

## Estado atual (redesign "AuroraRPG" — 2026-09-28)

O front foi unificado num visual só (paleta/tipografia do plano em
`documentacao/landing_page_plan.md` + dos mockups jpg), com CSS em
`styles/` e JS em `scripts/` — nada mais de `<style>`/`<script>` inline
nem CSS/JS solto na raiz por página.

- **`styles/`**: `tokens.css` (paleta oficial + tipografia), `base.css`
  (reset, fundo com orbs, header/nav/auth-bar compartilhados),
  `components.css` (botões, inputs, pills, badges, cards reaproveitados
  entre páginas) — os três são importados por toda página, nessa ordem,
  antes do CSS específico dela (`landing.css`, `support.css`,
  `monster-index.css`, `login.css`).
- **`scripts/`**: `session.js` (token/usuário em `localStorage`, renderiza
  o widget de autenticação do header via `#authBar`) é a base compartilhada;
  `personagens.js`, `support.js`, `login.js`, `monster-index.js` são um
  arquivo por página. `monster-api.js` (cliente da API de monstros, com
  fallback pra API pública e cache local) também mora aqui agora, ao lado
  de `monster-index.js` que o importa (`import ... from "./monster-api.js"`).
- **`index.html`** (Início + Personagens): header padrão, hero "AuroraRPG:
  Chega em Breve!", grade de cards de personagem (CRUD completo — criar,
  editar, excluir — contra `/personagens`). Campos são os placeholders
  reais do backend (nome/raca/classe/nivel/hp/mp), **não** o modelo D&D
  completo do mockup (alinhamento/AC/atributos) — decisão explícita da
  autora pra não mexer em `backend/personagem/` nessa rodada. Bloqueado
  (`gated-box`) se deslogado, com link pra `login.html`.
- **`login.html`**: mesmo formulário de sempre, agora usando
  `scripts/session.js` (login/registrar) em vez de duplicar
  `localStorage` na mão.
- **`suporte/suporte.html`** (Central de Suporte Arcano): antes era mock
  (array fake, `POST /support` que não existia). Agora liga de verdade em
  `POST /tickets` e `GET /tickets/me`. Pra isso, `backend/tickets/` ganhou
  um 4º tipo (`pedidos`) e um campo `priority` (baixa/media/alta/critica)
  — ver `backend/tickets/ticketSchema.ts`/`ticketRepository.ts`.
- **`indexMonstros/monster-index.html`** (Bestiário): CSS/JS inline
  extraídos pra `styles/monster-index.css` + `scripts/monster-index.js`
  (mesmo padrão das outras páginas), depois de coordenado com a autora —
  os dois estavam sendo editados em paralelo (ela rodando o redesign
  "AuroraRPG" nas outras páginas, esta sessão adicionando filtro
  completo/paginação/correção dos chips de tipo aqui). Nessa mesma
  passada: chips de tipo (`#typesBar`) agora são gerados em runtime a
  partir dos tipos realmente presentes nos dados carregados (antes era
  uma lista fixa no HTML que nascia incompleta e fazia tipos como
  "dragon" sumirem do filtro); filtro de tamanho ganhou Tiny/Gargantuan;
  tabela ganhou paginação client-side (`PAGE_SIZE = 20`); e
  `monster-api.js`/`prefetchBatch()` passou a tentar de novo índices que
  falharam antes de devolver, com aviso + botão de retry manual na
  página quando algo não carrega (a causa raiz de categorias sumirem era
  falha de rede silenciosa no carregamento massivo dos 334 monstros, uma
  requisição por monstro). Também removida a linha solta de "Hit dice"
  no lore do card em destaque.
- **Removidos** (superados pelas páginas acima, nada mais os referenciava):
  `tickets.html`/`.css`/`.js` (papel absorvido por `suporte/suporte.html`),
  `monstros.html`/`.css`/`.js` (papel absorvido por
  `indexMonstros/monster-index.html`), `style.css`/`script.js` da raiz
  (lógica migrou pra `styles/landing.css` + `scripts/personagens.js` +
  `scripts/session.js`), `login.css` antigo (virou `styles/login.css`).
- `documentacao/`: notas de planejamento (paleta de cores, mockups, plano
  de redesign) — não fazem parte da imagem Docker (`.dockerignore`).
- `Dockerfile` (`nginx:alpine`, `COPY . .`) + `.dockerignore`: não precisou
  mudar por causa do redesign (`COPY . .` já pega `styles/`/`scripts/`
  automaticamente). **Rebuild não confirmado nesta sessão** — Docker
  Desktop estava fechado nesta máquina (mesma pendência já registrada pro
  backend em `../CLAUDE.md`). Guia completo em `../DOCKER.md`.
- `node_modules/` aqui dentro é residual — ignore.
- Checklist de próximos passos: `to-do.md`.

## Pendências desta rodada

- **Docker**: rebuildar e retestar a imagem do front (e do backend, que
  também tem mudança pendente) quando o Docker Desktop estiver aberto.
- **`database.sqlite` local**: a extensão do schema de `tickets`
  (prioridade + tipo `pedidos`) foi migrada preservando os dados que já
  existiam (não precisou apagar o banco) — ver comentário em
  `backend/tickets/ticketRepository.ts` se isso precisar ser refeito numa
  outra máquina/checkout limpo.

## Convenções e segurança

- URL base da API numa constante só por arquivo que precisa dela
  (`API_BASE_URL`, definida em `scripts/session.js` e reaproveitada pelos
  scripts que o carregam antes).
- Dado vindo da API/do usuário vai pro DOM com `textContent`/`createElement`,
  nunca `innerHTML`.
- Sessão/autenticação: JWT no header `Authorization: Bearer <token>`, token
  e usuário em `localStorage` (`scripts/session.js` — única fonte, não
  duplicar em outro arquivo).
- O CORS do backend usa lista fixa de origens; se o front mudar de origem
  (ex: container nginx), a origem nova precisa entrar em `../backend/src/app.ts`.
- Não commite `.env`, tokens ou senhas.

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
