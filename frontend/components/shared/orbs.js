// ==========================================================
// ESFERAS DO DRAGÃO: pixel art gerada por código
// ==========================================================
// Par do base.css (.pixel-orb). Em vez de uma imagem, desenho a esfera
// pixel a pixel num canvas minúsculo (24x24) e uso o resultado como
// background ampliado com `image-rendering: pixelated` — fica com pixel
// quadrado e nítido em qualquer tamanho. Design original: uma esfera de
// vidro com brilho e um motivo dentro (não reproduz as esferas de nenhuma
// franquia; a referência foi só a ideia de "esfera mística com desenho").
//
// Dois motivos experimentais:
//   "chama" — chama vermelha dentro da esfera âmbar
//   "olho"  — olho de dragão (pupila em fenda) dentro da esfera azul-turquesa
// Escolha: abra qualquer página com ?orbe=chama | olho | portal | mix. A escolha
// fica salva no localStorage (só conveniência; sem ele o padrão é "mix").
//
// Tudo numa IIFE: scripts clássicos compartilham escopo global.
(() => {
  const N = 24;                 // grade da esfera (24x24 pixels)
  const C = (N - 1) / 2;        // centro (11.5) — coordenadas de pixel são inteiras
  const R = N / 2;

  // Paletas da esfera, do ponto mais claro (perto da luz) ao mais escuro.
  const PALETAS = {
    chama: { corpo: ["#FFF4C2", "#FFD76A", "#FFA93A", "#E8702A", "#B8401E"], borda: "#3B0A0A" },
    olho:  { corpo: ["#D8FFF6", "#86E8D4", "#35B8B4", "#1C7C90", "#124A66"], borda: "#052230" },
  };

  // Chama em sprite 9x11. d = vermelho escuro (contorno), r = vermelho,
  // o = laranja, y = amarelo (miolo quente).
  const CHAMA = [
    "....d....",
    "...drd...",
    "...drrd..",
    "..drrrd..",
    "..drord..",
    ".drroord.",
    ".drooyord",
    ".droyyord",
    ".drooyord",
    "..drrrrd.",
    "...dddd..",
  ];
  const COR_CHAMA = { d: "#7A0C12", r: "#D81E1E", o: "#FF6A1F", y: "#FFD24A" };

  function pixel(ctx, x, y, cor) {
    ctx.fillStyle = cor;
    ctx.fillRect(x, y, 1, 1);
  }

  // Esfera de vidro: bandas de cor conforme a distância até um ponto de luz
  // no alto à esquerda (quantizado em poucas faixas = cara de pixel art).
  function desenharEsfera(ctx, paleta) {
    const luzX = 7, luzY = 6;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const d = Math.hypot(x - C, y - C);
        if (d > R + 0.1) continue;                 // fora da esfera
        if (d > R - 1.3) { pixel(ctx, x, y, paleta.borda); continue; }

        const t = Math.hypot(x - luzX, y - luzY) / (R * 1.7);
        let faixa = Math.min(paleta.corpo.length - 1, Math.floor(t * paleta.corpo.length));
        // luz de rebote: a borda de baixo à direita clareia uma faixa
        if (d > R - 3 && (x - C) + (y - C) > 4) faixa = Math.max(0, faixa - 1);
        pixel(ctx, x, y, paleta.corpo[faixa]);
      }
    }
    // brilho especular branco (vidro)
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (Math.hypot(x - 6.5, y - 5.5) <= 1.6 && Math.hypot(x - C, y - C) < R - 1.3) {
          pixel(ctx, x, y, "#FFFFFF");
        }
      }
    }
    pixel(ctx, 9, 4, "#FFFFFF");
    pixel(ctx, 4, 9, "#FFFFFF");
  }

  function desenharChama(ctx) {
    const ox = Math.round(C - CHAMA[0].length / 2 + 0.5);
    const oy = Math.round(C - CHAMA.length / 2 + 0.5) + 1;
    CHAMA.forEach((linha, j) => {
      [...linha].forEach((ch, i) => {
        if (ch !== ".") pixel(ctx, ox + i, oy + j, COR_CHAMA[ch]);
      });
    });
  }

  // Olho amendoado: a altura da pálpebra em cada coluna segue uma curva
  // (mais alto no meio, fecha nas pontas). Íris em anéis de quente→frio,
  // pupila em fenda de 2 pixels de largura, um pontinho de luz.
  function desenharOlho(ctx) {
    const a = 7.5, b = 4.6, cy = C + 0.5;
    for (let x = 0; x < N; x++) {
      const dx = x - C;
      if (Math.abs(dx) > a) continue;
      const h = b * Math.pow(1 - (dx / a) ** 2, 0.7);
      for (let y = 0; y < N; y++) {
        const dy = y - cy;
        if (Math.abs(dy) > h + 0.5) continue;
        const borda = Math.abs(dy) > h - 0.6;
        let cor;
        if (borda) cor = "#2A0A3A";
        else {
          const t = Math.abs(dx) / a;
          cor = t < 0.3 ? "#FFE45A" : t < 0.55 ? "#FF9A2A" : t < 0.8 ? "#E8371E" : "#A3141A";
          if (Math.abs(dx) < 1) cor = "#0B0208";   // pupila em fenda
        }
        pixel(ctx, x, y, cor);
      }
    }
    pixel(ctx, 8, 9, "#FFFFFF");                   // reflexo
  }

  // Portal: estrela de 4 pontas (curva "astroide": lados côncavos, pontas
  // finas) com núcleo branco esfriando pra lilás → violeta, e braços de
  // espiral pontilhados em volta, como a estrela dentro do túnel da
  // referência. Sem borda de esfera: o portal flutua solto.
  function desenharPortal(ctx) {
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const dx = x - C, dy = y - C;
        const d = Math.hypot(dx, dy);
        const v = Math.pow(Math.abs(dx) / R, 2 / 3) + Math.pow(Math.abs(dy) / R, 2 / 3);

        if (v <= 1) {
          const cor = v < 0.28 ? "#FFFFFF" : v < 0.5 ? "#EBD9FF"
                    : v < 0.75 ? "#B77CFF" : v < 0.92 ? "#7A2FE0" : "#3E1580";
          pixel(ctx, x, y, cor);
          continue;
        }
        // espiral: braços onde sin(3*ângulo + raio) é alto, só em pixels
        // alternados (dither) pra manter cara de pixel art
        if (d >= 6.5 && d <= 11.2 && (x + y) % 2 === 0) {
          const s = Math.sin(3 * Math.atan2(dy, dx) + d * 0.8);
          if (s > 0.85) pixel(ctx, x, y, "#A78BFA");
          else if (s > 0.5) pixel(ctx, x, y, "#6D28D9");
        }
      }
    }
  }

  function gerarSprite(variante) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = N;
    const ctx = canvas.getContext("2d");
    if (variante === "portal") { desenharPortal(ctx); return canvas.toDataURL(); }
    desenharEsfera(ctx, PALETAS[variante]);
    if (variante === "olho") desenharOlho(ctx); else desenharChama(ctx);
    return canvas.toDataURL();
  }

  function varianteEscolhida() {
    let v = new URLSearchParams(location.search).get("orbe");
    try {
      if (v) localStorage.setItem("aurora_orbe", v);
      else v = localStorage.getItem("aurora_orbe");
    } catch (e) { /* localStorage bloqueado: segue com o padrão */ }
    return ["chama", "olho", "portal", "mix"].includes(v) ? v : "mix";
  }

  // Posição (% do alto da página / lado) e tamanho em múltiplos de 24 px
  // pra cada "pixel" virar um número inteiro de pixels de tela.
  const POSICOES = [
    { t: 3,  l: 4,  s: 48 }, { t: 8,  r: 5,  s: 72 }, { t: 21, l: 13, s: 48 },
    { t: 29, r: 15, s: 48 }, { t: 42, l: 3,  s: 96 }, { t: 53, r: 6,  s: 48 },
    { t: 66, l: 10, s: 72 }, { t: 76, r: 3,  s: 96 }, { t: 88, l: 7,  s: 48 },
    { t: 92, r: 17, s: 72 },
  ];

  function criarFaiscas(orb) {
    for (let i = 0; i < 3; i++) {
      const f = document.createElement("span");
      f.className = "orb-spark";
      const tam = 6 + Math.floor(Math.random() * 3) * 2;   // 6, 8 ou 10 px
      f.style.width = f.style.height = tam + "px";
      f.style.left = (Math.random() * 120 - 10) + "%";
      f.style.top = (Math.random() * 120 - 10) + "%";
      f.style.animationDelay = (Math.random() * 2.5) + "s";
      f.style.animationDuration = (1.6 + Math.random() * 1.6) + "s";
      orb.appendChild(f);
    }
  }

  function iniciar() {
    document.querySelectorAll(".pixel-orb").forEach((el) => el.remove()); // divs antigas do HTML
    const modo = varianteEscolhida();
    const sprites = { chama: gerarSprite("chama"), olho: gerarSprite("olho"), portal: gerarSprite("portal") };

    POSICOES.forEach((p, i) => {
      const variante = modo === "mix" ? ["chama", "olho", "portal"][i % 3] : modo;
      const orb = document.createElement("div");
      orb.className = "pixel-orb" + (variante === "chama" ? "" : " orb-" + variante);
      orb.style.backgroundImage = `url(${sprites[variante]})`;
      // portal é só estrela + redemoinho (sem corpo de esfera), então precisa
      // de mais área pra ter a mesma presença; 48→72, 72→96, 96→120 (múltiplos de 24)
      const tam = variante === "portal" ? p.s + 24 : p.s;
      orb.style.width = orb.style.height = tam + "px";
      orb.style.top = p.t + "%";
      if (p.l !== undefined) orb.style.left = p.l + "%"; else orb.style.right = p.r + "%";
      orb.style.animationDuration = (7 + (i % 4) * 1.5) + "s, " + (2 + (i % 3) * 0.5) + "s";
      orb.style.animationDelay = (-i * 1.3) + "s, 0s";
      criarFaiscas(orb);
      document.body.appendChild(orb);
    });
  }

  iniciar();
})();
