// ==========================================================
// EFEITO DE CARTA: inclinação 3D que segue o mouse
// ==========================================================
// Par do card-fx.css (lá está a aparência; aqui só a matemática do mouse).
//
// Por que um listener no `document` (event delegation) e não um por card:
// os cards do bestiário e de personagens são criados em runtime, depois
// que a página carrega. Um listener no documento enxerga qualquer card,
// velho ou novo, sem precisar "reanexar" nada a cada renderização.

// Tudo dentro de uma IIFE: scripts clássicos compartilham o escopo global,
// e `const menosMovimento` aqui colidiria com o de landing.js.
(() => {
const SELETOR_CARTA = ".hero-nav-card, .rpg-battle-card, .character-card";
const INCLINACAO_MAX = 10; // graus nas bordas do card

const semHover = window.matchMedia("(hover: none)").matches;
const menosMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function resetarCarta(carta) {
  carta.style.removeProperty("--rx");
  carta.style.removeProperty("--ry");
  carta.style.removeProperty("--mx");
  carta.style.removeProperty("--my");
}

if (!semHover && !menosMovimento) {
  document.addEventListener("pointermove", (e) => {
    const carta = e.target.closest(SELETOR_CARTA);
    if (!carta) return;

    const r = carta.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;   // 0 (esquerda) → 1 (direita)
    const y = (e.clientY - r.top) / r.height;   // 0 (topo) → 1 (base)

    // Mouse à direita → borda direita "afunda" → rotateY positivo.
    // Mouse embaixo → borda de baixo afunda → rotateX negativo (por isso o sinal).
    carta.style.setProperty("--ry", `${(x - 0.5) * 2 * INCLINACAO_MAX}deg`);
    carta.style.setProperty("--rx", `${-(y - 0.5) * 2 * INCLINACAO_MAX}deg`);
    carta.style.setProperty("--mx", `${x * 100}%`);
    carta.style.setProperty("--my", `${y * 100}%`);
  });

  // pointerout borbulha (mouseleave não), e dispara também ao passar pra um
  // filho do card — o relatedTarget evita resetar nesse caso.
  document.addEventListener("pointerout", (e) => {
    const carta = e.target.closest(SELETOR_CARTA);
    if (carta && !carta.contains(e.relatedTarget)) resetarCarta(carta);
  });
}
})();
