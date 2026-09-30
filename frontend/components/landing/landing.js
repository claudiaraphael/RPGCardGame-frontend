// ==========================================================
// PÁGINA: index.html (Início)
// ==========================================================
// Depende de components/shared/session.js (estaLogado) e, opcionalmente,
// de GSAP e tsParticles (CDN). Se um CDN falhar, a página continua
// funcionando — só perde o efeito (por isso os `typeof ... !== "undefined"`).

const menosMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// --- Botão de entrada: muda conforme sessão (evita mandar quem já está
// logado de volta pro login).
const heroActions = document.getElementById("heroActions");
const acao = document.createElement("a");
acao.className = "btn-primary";
if (estaLogado()) {
  acao.href = "components/personagens/personagens.html";
  acao.textContent = "Ir para Personagens";
} else {
  acao.href = "components/login/login.html";
  acao.textContent = "Entrar / Criar Conta";
}
heroActions.appendChild(acao);

// --- Título: letras entram uma a uma (estilo grimório).
// Separo em <span> na mão em vez de usar lib de split: são 3 linhas e
// evita mais uma dependência de CDN. createElement/textContent (nunca
// innerHTML), seguindo a convenção do front.
function animarTitulo() {
  const titulo = document.querySelector(".hero-banner h2");
  if (!titulo || menosMovimento || typeof gsap === "undefined") return;

  const texto = titulo.textContent;
  titulo.setAttribute("aria-label", texto); // leitor de tela lê a frase inteira
  titulo.textContent = "";

  const letras = [...texto].map((char) => {
    const span = document.createElement("span");
    span.textContent = char;
    span.setAttribute("aria-hidden", "true");
    span.style.display = "inline-block";
    span.style.whiteSpace = "pre"; // preserva os espaços entre palavras
    titulo.appendChild(span);
    return span;
  });

  gsap.from(letras, {
    opacity: 0,
    y: 24,
    rotateX: -80,
    duration: 0.6,
    ease: "back.out(1.6)",
    stagger: 0.04,
  });

  // Pulsar suave do brilho do banner depois da entrada.
  gsap.to(".hero-banner", {
    boxShadow: "0 0 55px rgba(223, 95, 71, 0.85)",
    duration: 1.6,
    ease: "sine.inOut",
    repeat: -1,
    yoyo: true,
    delay: 1.2,
  });
}

// --- Brasas subindo atrás do hero.
function iniciarBrasas() {
  if (menosMovimento || typeof tsParticles === "undefined") return;

  tsParticles.load({
    id: "heroParticles",
    options: {
      fullScreen: { enable: false }, // fica dentro do #heroParticles, não cobre a página
      fpsLimit: 60,
      background: { color: "transparent" },
      particles: {
        number: { value: 45 },
        color: { value: ["#FFD698", "#DF5F47", "#BE1818"] }, // --c-yellow/--c-orange/--c-red
        shape: { type: "circle" },
        size: { value: { min: 1, max: 3.5 } },
        opacity: {
          value: { min: 0.3, max: 0.9 },
          animation: { enable: true, speed: 0.8, sync: false },
        },
        move: {
          enable: true,
          direction: "top",
          speed: { min: 0.6, max: 1.8 },
          random: true,
          straight: false,
          outModes: { default: "out" },
        },
        wobble: { enable: true, distance: 12, speed: 4 },
      },
      detectRetina: true,
    },
  });
}

animarTitulo();
iniciarBrasas();
