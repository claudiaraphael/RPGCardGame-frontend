# to-do.md — Frontend (RPGCardGame)

Checklist do front. Ver `CLAUDE.md` (nesta pasta) pro estado detalhado do
redesign "AuroraRPG" feito em 2026-09-28.

## Feito nesta rodada (redesign AuroraRPG)

- [x] `styles/tokens.css` + `base.css` + `components.css` (sistema de
      design compartilhado — paleta, header/nav/auth-bar, botões/pills/cards)
- [x] `scripts/session.js` (sessão/token unificados em `localStorage`,
      widget de autenticação do header)
- [x] `index.html`: header padrão + hero + grade de personagens (CRUD
      completo contra `/personagens`) — `scripts/personagens.js`
- [x] `login.html` reskinado, usando `scripts/session.js`
- [x] `suporte/suporte.html` ligado de verdade a `/tickets` (4 tipos +
      prioridade) — `scripts/support.js`
- [x] Backend: `tickets` ganhou tipo `pedidos` + campo `priority`
- [x] Removidos: `tickets.html`/`.css`/`.js`, `monstros.html`/`.css`/`.js`,
      `style.css`/`script.js` (raiz), `login.css` antigo

## Pendente

- [ ] `indexMonstros/monster-index.html`: extrair `<style>`/`<script>`
      inline pra `styles/monster-index.css` + `scripts/monster-index.js`
      (pausado — a autora estava editando esse arquivo em paralelo,
      adicionou paginação; falta também terminar/checar a geração
      dinâmica dos chips de tipo, `gerarChipsDeTipo()`, referenciada num
      comentário mas ainda não implementada)
- [ ] Rebuildar e testar a imagem Docker do front (Docker Desktop estava
      fechado nesta sessão) — `Dockerfile` não deveria precisar mudar
      (`COPY . .`), só confirmar
- [ ] Conferir CORS depois que a imagem do front rodar num container (porta
      muda de `:5500` pra a do nginx) — `backend/src/app.ts`
- [ ] Corrigir o remote `origin` do repo antigo
      (`C:\Users\claud\portfolio\JavaScript\RPGCardGame\`) ou confirmar que
      ele não é mais usado (o front vive aqui agora, `frontend/`, no repo
      principal já publicado)

## Depois do redesign

- [ ] Modelo real de personagem (raça/classe/atributos D&D, alinhamento,
      AC) — hoje `index.html` usa só os placeholders do backend
      (nome/raca/classe/nivel/hp/mp)
- [ ] Geração/visualização de cartas (depende da modelagem em
      `auth/User.ts` e `Systems/`, trabalho da autora)
- [ ] Documentação interativa/vídeo de entrega

## Lembretes

- Regra da disciplina: **≥ 50% do código é da autora**. Este arquivo é só
  o mapa.
- Comentários de código em português, com o *porquê* das escolhas.
- Commits e push ficam sempre com a autora.
