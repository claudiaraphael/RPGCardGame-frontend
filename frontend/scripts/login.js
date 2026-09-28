// ==========================================================
// PÁGINA: login.html
// ==========================================================
// Usa as funções de scripts/session.js (login/registrar/salvarSessao) em
// vez de duplicar localStorage na mão — precisa de session.js carregado
// antes deste arquivo.

const formLogin = document.getElementById("form-login");
const formRegistro = document.getElementById("form-registro");
const mensagemStatus = document.getElementById("mensagem-status");
const usuarioLogadoEl = document.getElementById("usuario-logado");
const usuarioNomeEl = document.getElementById("usuario-nome");
const btnSair = document.getElementById("btn-sair");

function mostrarSessaoAtual() {
  const usuario = obterUsuario();

  if (!usuario) {
    usuarioLogadoEl.hidden = true;
    return;
  }

  usuarioNomeEl.textContent = usuario.username ?? usuario.email;
  usuarioLogadoEl.hidden = false;
}

formLogin.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mensagemStatus.textContent = "Entrando...";

  try {
    await login(
      document.getElementById("login-email").value,
      document.getElementById("login-senha").value,
    );
    mensagemStatus.textContent = "Login feito com sucesso.";
    formLogin.reset();
    mostrarSessaoAtual();
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
    mensagemStatus.textContent = "Conta criada e login feito com sucesso.";
    formRegistro.reset();
    mostrarSessaoAtual();
  } catch (erro) {
    console.error(erro);
    mensagemStatus.textContent = erro.message;
  }
});

btnSair.addEventListener("click", () => {
  limparSessao();
  mensagemStatus.textContent = "Você saiu.";
  mostrarSessaoAtual();
});

mostrarSessaoAtual();
