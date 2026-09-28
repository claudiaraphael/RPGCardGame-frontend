# to-do.md — Frontend (RPGCardGame)

Checklist do front. Ver `CLAUDE.md` (nesta pasta) pro estado detalhado da
estrutura em `components/`.

## Feito

- [x] Redesign visual "AuroraRPG" (paleta/tipografia unificadas)
- [x] `index.html`: header padrão + hero (só Início — a gestão de
      personagens virou página própria)
- [x] `components/personagens/personagens.html`: grade de personagens
      (CRUD completo contra `/personagens`), separada do `index.html`
- [x] `components/login/login.html` reskinado, sessão compartilhada,
      redireciona pra `personagens.html` depois de logar
- [x] `components/suporte/suporte.html` ligado de verdade a `/tickets`
      (4 tipos + prioridade — backend estendido)
- [x] `components/bestiario/monster-index.html`: paginação, chips de tipo
      gerados em runtime, retry de monstros que falharem no carregamento
- [x] Reorganização: uma pasta por página em `components/` (`shared/`,
      `landing/`, `login/`, `suporte/`, `bestiario/`) — antes era separado
      por tipo de arquivo (`styles/` vs `scripts/`)
- [x] Removidos: `tickets.html`/`.css`/`.js`, `monstros.html`/`.css`/`.js`,
      `style.css`/`script.js`/`login.css`/`login.js` antigos da raiz

## Pendente

- [ ] Rebuildar e testar a imagem Docker do front (Docker Desktop estava
      fechado na última sessão) — `Dockerfile` não deveria precisar mudar
      (`COPY . .`), só confirmar
- [ ] Conferir CORS depois que a imagem do front rodar num container (porta
      muda de `:5500` pra a do nginx) — `backend/src/app.ts`
- [ ] Corrigir o remote `origin` do repo antigo
      (`C:\Users\claud\portfolio\JavaScript\RPGCardGame\`) ou confirmar que
      ele não é mais usado (o front vive aqui agora, `frontend/`, no repo
      principal já publicado)
- [ ] `claude-arquitetura.md`: conteúdo de outra conversa, sem relação com
      o projeto — decidir se apaga

## Depois

- [ ] Modelo real de personagem (raça/classe/atributos D&D, alinhamento,
      AC, retrato/foto) — hoje `personagens.html` usa só os placeholders
      do backend (nome/raca/classe/nivel/hp/mp)
- [ ] Geração/visualização de cartas (depende da modelagem em
      `auth/User.ts` e `Systems/`, trabalho da autora)
- [ ] Documentação interativa/vídeo de entrega

## Lembretes

- Regra da disciplina: **≥ 50% do código é da autora**. Este arquivo é só
  o mapa.
- Comentários de código em português, com o *porquê* das escolhas.
- Commits e push ficam sempre com a autora.
