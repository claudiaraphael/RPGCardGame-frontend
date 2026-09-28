// ==========================================================
// PÁGINA: login.html
// ==========================================================
// Usa as funções de components/shared/session.js (login/registrar/salvarSessao) em
// vez de duplicar localStorage na mão — precisa de session.js carregado
// antes deste arquivo.

const formLogin = document.getElementById("form-login");
const formRegistro = document.getElementById("form-registro");
const mensagemStatus = document.getElementById("mensagem-status");

// Pra onde o login leva depois de autenticar — página de criação de
// personagem (placeholder por enquanto, ver criacaoPersonagens.html).
const DESTINO_APOS_LOGIN = "../personagens/criacaoPersonagens.html";

// Quem já está logado e cai em login.html de novo (ex: voltou pelo
// histórico do navegador) é mandado direto pro destino, em vez de ver
// o formulário — antes ficava só um aviso "Logado como" no rodapé da
// página, fácil de não notar.
function mostrarSessaoAtual() {
  if (estaLogado()) {
    window.location.href = DESTINO_APOS_LOGIN;
  }
}

formLogin.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mensagemStatus.textContent = "Entrando...";

  try {
    await login(
      document.getElementById("login-email").value,
      document.getElementById("login-senha").value,
    );
    // Redireciona na hora — é o que resolve de verdade "apertei Entrar e
    // não aconteceu nada": antes só trocava um texto na própria página.
    window.location.href = DESTINO_APOS_LOGIN;
  } catch (erro) {
    console.error(erro);
    mensagemStatus.textContent = erro.message;
  }
});

formRegistro.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mensagemStatus.textContent = "Criando conta...";

  try {
    await registrar(
      document.getElementById("registro-email").value,
      document.getElementById("registro-username").value,
      document.getElementById("registro-senha").value,
    );
    window.location.href = DESTINO_APOS_LOGIN;
  } catch (erro) {
    console.error(erro);
    mensagemStatus.textContent = erro.message;
  }
});

mostrarSessaoAtual();
