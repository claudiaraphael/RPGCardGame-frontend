// ==========================================================
// PÁGINA: components/suporte/suporte.html (Central de Suporte Arcano)
// ==========================================================
// Extraído do <script> inline do protótipo, que usava um array mockado
// (tickets fake) e chamava POST /support (rota que não existe). Agora
// chama de verdade POST /tickets e GET /tickets/me — precisa de
// components/shared/session.js carregado antes deste arquivo (usa obterToken(),
// estaLogado()).

let currentCategory = "bugs";
let currentPriority = "media";

const ROTULOS_STATUS = {
  open: "Em Análise",
  in_progress: "Em Andamento",
  resolved: "Resolvido",
  closed: "Fechado",
};

function classeStatus(status) {
  return `status-${status}`;
}

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.style.display = "block";
  setTimeout(() => {
    t.style.display = "none";
  }, 3500);
}

function atualizarEstadoAcesso() {
  const supportLayout = document.getElementById("supportLayout");
  const gatedBox = document.getElementById("gatedBox");

  if (estaLogado()) {
    supportLayout.style.display = "grid";
    gatedBox.style.display = "none";
    carregarMeusTickets();
  } else {
    supportLayout.style.display = "none";
    gatedBox.style.display = "flex";
  }
}

// Abas de categoria
document.querySelectorAll(".cat-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".cat-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    currentCategory = tab.dataset.cat;
  });
});

// Seletor de prioridade
document.querySelectorAll(".priority-pills .pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".priority-pills .pill").forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    currentPriority = pill.dataset.val;
  });
});

// Renderizar histórico de chamados — textContent em tudo que vem do
// backend (título é texto livre digitado pelo usuário).
function renderTickets(tickets) {
  const container = document.getElementById("ticketHistoryList");
  container.replaceChildren();
  document.getElementById("ticketCount").textContent = `${tickets.length} chamados`;

  if (tickets.length === 0) {
    const vazio = document.createElement("p");
    vazio.style.cssText = "color:#94A3B8; font-size:0.85rem;";
    vazio.textContent = "Você ainda não abriu nenhum chamado.";
    container.appendChild(vazio);
    return;
  }

  tickets.forEach((t) => {
    const item = document.createElement("div");
    item.className = "ticket-item";

    const top = document.createElement("div");
    top.className = "ticket-top";

    const id = document.createElement("span");
    id.className = "ticket-id";
    id.textContent = `#${t.id.slice(0, 8)}`;

    const status = document.createElement("span");
    status.className = `badge-status ${classeStatus(t.status)}`;
    status.textContent = ROTULOS_STATUS[t.status] ?? t.status;

    top.append(id, status);

    const titulo = document.createElement("div");
    titulo.className = "ticket-title-text";
    titulo.textContent = t.title;

    const data = document.createElement("div");
    data.className = "ticket-date";
    data.textContent = new Date(t.createdAt).toLocaleString("pt-BR");

    item.append(top, titulo, data);
    container.appendChild(item);
  });
}

async function carregarMeusTickets() {
  try {
    const resposta = await fetch(`${API_BASE_URL}/tickets/me`, {
      headers: { Authorization: `Bearer ${obterToken()}` },
    });

    if (!resposta.ok) {
      throw new Error(`Backend respondeu ${resposta.status}`);
    }

    const { tickets } = await resposta.json();
    renderTickets(tickets);
  } catch (erro) {
    console.error(erro);
    showToast("Não foi possível carregar seu histórico de chamados.");
  }
}

async function handleSendTicket(e) {
  e.preventDefault();

  if (!estaLogado()) {
    showToast("Faça login primeiro.");
    return;
  }

  const subject = document.getElementById("ticketSubject").value.trim();
  const details = document.getElementById("ticketDetails").value.trim();

  try {
    const resposta = await fetch(`${API_BASE_URL}/tickets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${obterToken()}`,
      },
      body: JSON.stringify({
        type: currentCategory,
        title: subject,
        description: details,
        priority: currentPriority,
      }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      showToast(dados.message ?? dados.error ?? "Não foi possível enviar o chamado.");
      return;
    }

    showToast(`Chamado #${dados.ticket.id.slice(0, 8)} criado com sucesso!`);
    document.getElementById("supportForm").reset();
    carregarMeusTickets();
  } catch (erro) {
    console.error(erro);
    showToast("Não foi possível contatar o backend. Ele está rodando em localhost:3000?");
  }
}

document.getElementById("supportForm").addEventListener("submit", handleSendTicket);
document.getElementById("btnGoToLogin")?.addEventListener("click", () => {
  window.location.href = document.getElementById("authBar")?.dataset.loginHref || "login.html";
});

// session.js dispara este evento quando o usuário clica em "Sair" —
// mantém a Central de Suporte em sincronia sem precisar recarregar.
document.addEventListener("sessao-alterada", atualizarEstadoAcesso);

atualizarEstadoAcesso();
