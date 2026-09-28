// ==========================================================
// SESSÃO: token + usuário compartilhados entre páginas
// ==========================================================
// Antes havia duas convenções diferentes (sessionStorage em script.js,
// localStorage em login.js/tickets.js) — unificado aqui em localStorage,
// porque o header compartilhado (auth-bar) precisa saber quem está logado
// em qualquer página, não só na que fez o login.
//
// Carregado como <script src="components/shared/session.js"></script> (script
// clássico, não module) antes do script específico de cada página.

const API_BASE_URL = "http://localhost:3000";
const CHAVE_TOKEN = "rpgcardgame_token";
const CHAVE_USUARIO = "rpgcardgame_usuario";

function salvarSessao(usuario, accessToken) {
  localStorage.setItem(CHAVE_TOKEN, accessToken);
  localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
}

function limparSessao() {
  localStorage.removeItem(CHAVE_TOKEN);
  localStorage.removeItem(CHAVE_USUARIO);
}

function obterToken() {
  return localStorage.getItem(CHAVE_TOKEN);
}

function obterUsuario() {
  const salvo = localStorage.getItem(CHAVE_USUARIO);
  if (!salvo) return null;

  try {
    return JSON.parse(salvo);
  } catch {
    return null;
  }
}

function estaLogado() {
  return Boolean(obterToken() && obterUsuario());
}

async function login(email, senha) {
  const resposta = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: senha }),
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.message ?? "Falha no login");
  }

  salvarSessao(dados.user, dados.accessToken);
  return dados.user;
}

async function registrar(email, username, senha) {
  const resposta = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password: senha }),
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.message ?? "Falha ao criar conta");
  }

  // /auth/register não devolve token — loga em seguida com a mesma senha.
  return login(email, senha);
}

// Renderiza o widget de autenticação do header (#authBar) em toda página
// que o tiver: user-pill + "Sair" se logado, link "Entrar" se não. Chamada
// automática no fim deste arquivo — não precisa ser chamada manualmente.
function renderizarAuthBar() {
  const container = document.getElementById("authBar");
  if (!container) return;

  container.replaceChildren();
  const usuario = obterUsuario();

  if (usuario) {
    const pill = document.createElement("div");
    pill.className = "user-pill";

    const avatar = document.createElement("div");
    avatar.className = "user-avatar";
    avatar.textContent = (usuario.username ?? usuario.email ?? "?").charAt(0).toUpperCase();

    const nome = document.createElement("span");
    nome.textContent = usuario.username ?? usuario.email;

    pill.append(avatar, nome);

    const btnSair = document.createElement("button");
    btnSair.type = "button";
    btnSair.className = "btn-auth-toggle";
    btnSair.textContent = "Sair";
    btnSair.addEventListener("click", () => {
      limparSessao();
      renderizarAuthBar();
      // Páginas que exigem login (ex: suporte.html) escutam este evento
      // pra voltar a mostrar o estado bloqueado sem precisar recarregar.
      document.dispatchEvent(new CustomEvent("sessao-alterada"));
    });

    container.append(pill, btnSair);
  } else {
    const linkEntrar = document.createElement("a");
    linkEntrar.className = "btn-auth-toggle";
    linkEntrar.textContent = "Entrar";
    // Caminho relativo pro login muda conforme a profundidade da página
    // (index.html na raiz usa "components/login/login.html", suporte.html
    // usa "../login/login.html" etc.) — por isso vem de um data-attribute
    // no próprio #authBar (ver HTML de cada página), não de um valor fixo
    // aqui. O fallback abaixo só cobre uma página futura que esqueça de
    // declarar o attribute.
    linkEntrar.href = container.dataset.loginHref || "login.html";

    container.appendChild(linkEntrar);
  }
}

renderizarAuthBar();
