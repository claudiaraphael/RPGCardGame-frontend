// ==========================================================
// PÁGINA: components/personagens/personagens.html — CRUD (backend/personagem/)
// ==========================================================
// Campos são os placeholders reais do backend (nome/raca/classe/nivel/hp/mp)
// — não o modelo D&D completo do mockup (alinhamento/AC/atributos/foto),
// que ainda não existe no schema (ver CLAUDE.md). Precisa de
// ../shared/session.js carregado antes deste arquivo.

const gatedBox = document.getElementById("gatedBox");
const charactersLayout = document.getElementById("charactersLayout");
const grid = document.getElementById("characterGrid");
const formWrap = document.getElementById("form-personagem-wrap");
const form = document.getElementById("form-personagem");
const formTitulo = document.getElementById("form-personagem-titulo");
const personagemStatus = document.getElementById("personagem-status");
const btnCancelar = document.getElementById("btn-cancelar-personagem");

let idEmEdicao = null;

function atualizarEstadoAcesso() {
  if (estaLogado()) {
    charactersLayout.style.display = "flex";
    gatedBox.style.display = "none";
    carregarPersonagens();
  } else {
    charactersLayout.style.display = "none";
    gatedBox.style.display = "flex";
    formWrap.hidden = true;
  }
}

function abrirFormularioCriacao() {
  idEmEdicao = null;
  formTitulo.textContent = "Criar personagem";
  form.reset();
  formWrap.hidden = false;
  formWrap.scrollIntoView({ behavior: "smooth", block: "center" });
}

function abrirFormularioEdicao(personagem) {
  idEmEdicao = personagem.id;
  formTitulo.textContent = `Editar ${personagem.nome}`;
  document.getElementById("personagem-nome").value = personagem.nome;
  document.getElementById("personagem-raca").value = personagem.raca;
  document.getElementById("personagem-classe").value = personagem.classe;
  document.getElementById("personagem-nivel").value = personagem.nivel;
  document.getElementById("personagem-hp").value = personagem.hp;
  document.getElementById("personagem-mp").value = personagem.mp;
  formWrap.hidden = false;
  formWrap.scrollIntoView({ behavior: "smooth", block: "center" });
}

btnCancelar.addEventListener("click", () => {
  formWrap.hidden = true;
  form.reset();
});

async function carregarPersonagens() {
  try {
    const resposta = await fetch(`${API_BASE_URL}/personagens`, {
      headers: { Authorization: `Bearer ${obterToken()}` },
    });

    if (!resposta.ok) {
      throw new Error(`Backend respondeu ${resposta.status}`);
    }

    const { personagens } = await resposta.json();
    renderizarPersonagens(personagens);
  } catch (erro) {
    console.error(erro);
    personagemStatus.textContent = "Não foi possível carregar seus personagens.";
  }
}

function renderizarPersonagens(personagens) {
  // Só o card "+ Adicionar" fica fixo — os demais são recriados a cada
  // carregamento. textContent em todo dado do usuário (nunca innerHTML).
  grid.replaceChildren();

  personagens.forEach((p) => {
    const card = document.createElement("div");
    card.className = "character-card";

    const art = document.createElement("div");
    art.className = "character-card-art";
    art.textContent = p.nome.charAt(0).toUpperCase();

    const body = document.createElement("div");
    body.className = "character-card-body";

    const nome = document.createElement("div");
    nome.className = "character-card-name";
    nome.textContent = p.nome;

    const meta = document.createElement("div");
    meta.className = "character-card-meta";
    meta.textContent = `${p.raca} ${p.classe} — nível ${p.nivel}`;

    const stats = document.createElement("div");
    stats.className = "character-card-stats";
    const hp = document.createElement("span");
    hp.className = "stat-hp";
    hp.textContent = `HP ${p.hp}`;
    const mp = document.createElement("span");
    mp.className = "stat-mp";
    mp.textContent = `MP ${p.mp}`;
    stats.append(hp, mp);

    const acoes = document.createElement("div");
    acoes.className = "character-card-actions";

    const btnEditar = document.createElement("button");
    btnEditar.type = "button";
    btnEditar.className = "btn-edit-personagem";
    btnEditar.textContent = "Editar";
    btnEditar.addEventListener("click", () => abrirFormularioEdicao(p));

    const btnExcluir = document.createElement("button");
    btnExcluir.type = "button";
    btnExcluir.className = "btn-danger";
    btnExcluir.textContent = "Excluir";
    btnExcluir.addEventListener("click", () => excluirPersonagem(p));

    acoes.append(btnEditar, btnExcluir);
    body.append(nome, meta, stats, acoes);
    card.append(art, body);
    grid.appendChild(card);
  });

  const addCard = document.createElement("button");
  addCard.type = "button";
  addCard.className = "character-card-add";
  const plus = document.createElement("span");
  plus.className = "plus";
  plus.textContent = "+";
  const label = document.createElement("span");
  label.textContent = "Adicionar Novo Personagem";
  addCard.append(plus, label);
  addCard.addEventListener("click", abrirFormularioCriacao);
  grid.appendChild(addCard);
}

async function excluirPersonagem(personagem) {
  const confirmado = window.confirm(`Excluir "${personagem.nome}"? Essa ação não pode ser desfeita.`);
  if (!confirmado) return;

  try {
    const resposta = await fetch(`${API_BASE_URL}/personagens/${personagem.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${obterToken()}` },
    });

    if (!resposta.ok && resposta.status !== 204) {
      throw new Error(`Backend respondeu ${resposta.status}`);
    }

    personagemStatus.textContent = `"${personagem.nome}" excluído.`;
    carregarPersonagens();
  } catch (erro) {
    console.error(erro);
    personagemStatus.textContent = "Não foi possível excluir o personagem.";
  }
}

form.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  personagemStatus.textContent = idEmEdicao ? "Salvando..." : "Criando personagem...";

  const corpo = {
    nome: document.getElementById("personagem-nome").value,
    raca: document.getElementById("personagem-raca").value,
    classe: document.getElementById("personagem-classe").value,
    nivel: Number(document.getElementById("personagem-nivel").value),
    hp: Number(document.getElementById("personagem-hp").value),
    mp: Number(document.getElementById("personagem-mp").value),
  };

  const url = idEmEdicao ? `${API_BASE_URL}/personagens/${idEmEdicao}` : `${API_BASE_URL}/personagens`;
  const method = idEmEdicao ? "PUT" : "POST";

  try {
    const resposta = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${obterToken()}`,
      },
      body: JSON.stringify(corpo),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.message ?? "Falha ao salvar personagem");
    }

    personagemStatus.textContent = `Personagem "${dados.personagem.nome}" salvo.`;
    formWrap.hidden = true;
    form.reset();
    idEmEdicao = null;
    carregarPersonagens();
  } catch (erro) {
    console.error(erro);
    personagemStatus.textContent = erro.message;
  }
});

document.addEventListener("sessao-alterada", atualizarEstadoAcesso);

atualizarEstadoAcesso();
