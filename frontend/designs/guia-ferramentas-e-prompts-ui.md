# Guia: ferramentas de geração de UI + como montar um bom prompt

Feito porque você usou o Antigravity até os créditos acabarem e nunca tinha
feito design de UI antes. Objetivo: te dar opções pra continuar (grátis ou
baratas) e um método de prompt que funciona em qualquer uma delas — não é
sobre decorar um app específico, é sobre como pedir "UI boa" de um jeito que
a IA consiga cumprir.

## 1. Ferramentas (pra alternar quando uma acabar os créditos)

Todas geram HTML/CSS puro ou React a partir de prompt — dá pra pegar o
resultado e portar pro projeto (HTML/CSS puro, sem bundler, como já é aqui).

| Ferramenta | Free tier | Ponto forte | Cuidado |
|---|---|---|---|
| **v0 (Vercel)** | Créditos grátis mensais, renovam | Ótimo em componentes React/Tailwind isolados (um card, um form, uma tabela) | Gera em Tailwind — se for portar pro projeto (CSS puro), precisa "traduzir" as classes ou pedir explicitamente "HTML+CSS puro, sem framework" |
| **Claude (claude.ai), no navegador** | Plano grátis com limite de mensagens/dia | Já é o que você está usando aqui — mesma qualidade de raciocínio, dá pra pedir HTML/CSS puro direto, sem tradução | Sem preview visual ao vivo dentro do chat web (aqui no Claude Code eu consigo abrir screenshot pra você; no site não) |
| **Lovable** | Créditos grátis limitados por mês | Pensa em fluxo de app inteiro (várias telas conectadas), não só componente solto | Empurra pra arquitetura própria dele (Supabase etc.) — pra um projeto de disciplina como este, é melhor só pedir uma tela por vez e portar o HTML |
| **Figma (Figma AI / First Draft)** | Free tier bem generoso, sem "créditos" que acabam do jeito que Antigravity/v0 tem | Gera **layout visual**, não código — ótimo pra decidir a UI antes de pedir código pra qualquer IA | Não substitui a geração de código; é uma etapa antes |
| **21st.dev** | Biblioteca gratuita de componentes prontos (não gera sob demanda, você navega e copia) | Zero custo, zero créditos, referência rápida de "como um card/tabela/form bonito se parece" | Não é geração por prompt — é catálogo pra copiar/adaptar |

**Sugestão de fluxo pra você**: quando o Antigravity acabar, alterna pra
**v0** ou pro **Claude direto** pedindo HTML/CSS puro — não perde o
"salvo" de trabalho, porque o resultado é sempre um arquivo que você cola
aqui e eu adapto pro padrão do projeto (`components/<página>/`).

## 2. Como montar um prompt de geração de UI que funciona

A diferença entre "saiu feio" e "saiu bom" quase sempre é **quanto de
contexto de design você deu**, não a ferramenta. Um prompt fraco tipo "faz
uma tela de login bonita" deixa a IA improvisando cor, espaçamento,
hierarquia — cada ferramenta improvisa diferente, dá inconsistência entre
páginas (que é exatamente o que aconteceu aqui: cada tela parece ter vindo
de um pedido diferente).

Estrutura que funciona, nessa ordem:

### a) Contexto do produto (1-2 frases)
O que é a tela, quem usa, que ação importa mais.
> "Tela de login de um jogo de cartas RPG estilo D&D. O usuário mais comum
> é alguém testando o jogo pela primeira vez — o botão de entrar precisa
> ser o elemento mais óbvio da tela."

### b) Sistema visual (se já existir) ou referência
Se você já tem paleta/fonte decidida (este projeto tem: Cinzel pro título,
Inter pro corpo, paleta vermelho/dourado/azul-escuro em
`components/shared/tokens.css`), **cole os valores exatos** — cor em hex,
nome da fonte. Se não tem: descreva o clima com 2-3 adjetivos + um exemplo
("clima de pergaminho antigo de RPG de mesa, não cyberpunk neon") — ou
melhor ainda, anexe uma imagem de referência (print de outro jogo, arte,
etc.) se a ferramenta aceitar imagem.

### c) Restrições técnicas
> "HTML + CSS puro, sem framework, sem Tailwind, sem bundler. Um arquivo
> `.css` separado do `.html`. Responsivo (funciona em 375px de largura até
> 1440px)."

Isso sozinho already evita metade dos problemas que você teve (tabela que
estoura a tela, coluna cortada) — porque você força a IA a pensar em telas
estreitas, não só na largura que ela imaginou por padrão.

### d) Conteúdo real, não placeholder
Cole os campos/dados reais que a tela vai mostrar (ex: os campos de
personagem que o backend já tem: nome/raça/classe/nível/hp/mp). IA que
gera UI com "Lorem Ipsum" quase sempre erra o dimensionamento quando o
conteúdo real chega — foi o que aconteceu na tabela do bestiário (nome +
5 outras colunas de dado real não cabiam no espaço que a IA reservou
pensando em texto curto).

### e) O que "bom" significa pra você (o passo mais pulado)
Diga o que você valoriza: "pouco visual poluído, prefiro espaço em branco
a decoração", ou "quero que pareça carta de jogo física", ou "hierarquia
clara: título > ação principal > resto". Sem isso a IA escolhe por você —
e o resultado atual (muitas orbs soltas, gradiente saturado, pouca
hierarquia) é o que sobra quando ninguém decide isso.

### Exemplo de prompt completo (adaptado pra uma tela nova sua)
```
Preciso de uma landing page para o AuroraRPG, um jogo de cartas RPG
inspirado em D&D 5e. É a primeira tela que um visitante vê — hoje ela
está vazia, só um título "Chega em Breve". Quero comunicar em segundos
que tipo de jogo é isso e dar um motivo pra explorar o Bestiário
(nossa página mais pronta hoje).

Sistema visual: fonte de título Cinzel (serifada, peso 800), fonte de
corpo Inter. Paleta: fundo azul-escuro #060B68 a #040845, destaque
vermelho #BE1818, dourado #FFD698, laranja #DF5F47. Clima de pergaminho/
carta de RPG de mesa, não cyberpunk.

Restrição técnica: HTML + CSS puro, sem framework, responsivo de 375px
a 1440px, um arquivo CSS separado.

Prioridade de hierarquia: 1) nome do jogo + frase de efeito, 2) botão
"Explorar Bestiário", 3) 3 cards curtos mostrando o que o jogo oferece
(sem inventar features que não existem: hoje o que está pronto é
Bestiário navegável e criação de personagens).

O que valorizo: pouco elemento decorativo solto, mais espaço em branco,
hierarquia clara — não quero repetir os "orbs" (bolinhas flutuantes)
espalhados sem padrão que a versão atual tem.
```

## 3. O que fazer com o resultado

1. Peça a versão em HTML+CSS puro (mesmo que a ferramenta prefira React).
2. Cole o HTML/CSS aqui pro Claude Code — eu adapto pro padrão do projeto
   (`components/<página>/`, importa `tokens.css`→`base.css`→
   `components.css` primeiro, ver `frontend/CLAUDE.md`).
3. Não precisa portar tudo de uma vez — dá pra gerar uma tela por vez e ir
   trazendo.

## 4. Sobre a pasta `designs/`

Você criou `frontend/designs/` com `inspiracoes/`, `designs escolhidos/` e
`problemas/` — bom lugar pra:
- `inspiracoes/`: prints/links de telas que você gostou (de outros jogos,
  do Figma, do que a IA gerou e você curtiu parte).
- `designs escolhidos/`: a versão que vocês vão de fato usar por página.
- `problemas/`: pode usar pra guardar os prints "antes" (os screenshots
  que tirei hoje mostram bem o estado atual, se quiser referência de onde
  partimos).

Quando for popular, me avisa — eu leio o conteúdo e ajudo a decidir junto,
ou já parto pra implementar se você já tiver decidido.
