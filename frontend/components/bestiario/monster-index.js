// ==========================================================
// PÁGINA: components/bestiario/monster-index.html (Bestiário)
// ==========================================================
// Extraído dos dois <script> inline do protótipo original (o clássico e o
// `type="module"` que faz o fetch de verdade) e fundido num módulo só —
// os dois pedaços já se falavam via window.loadMonstersFromApi só por
// causa da separação clássico/módulo; num arquivo único isso não é mais
// necessário. Importa monster-api.js (mesma pasta), que tem o
// MonsterApiClient com fallback pra API pública e cache local.

import { defaultMonsterClient } from "./monster-api.js";

// Lista real vem do backend (ver carregarMonstrosDaApi, no fim deste
// arquivo). Começa vazia — nada de monstro inventado nem dado hardcoded
// representando a D&D API.
const monstersDatabase = [];
let currentList = [...monstersDatabase];
let selectedMonster = monstersDatabase[0];
let activeType = "all";
let sortKey = "challenge_rating";
let sortAsc = false;
let currentPage = 1;
const PAGE_SIZE = 20;

// Helper functions for MonsterSchema attributes
function calcMod(val) {
  const m = Math.floor((val - 10) / 2);
  return m >= 0 ? `(+${m})` : `(${m})`;
}

function formatSpeed(speed) {
  if (!speed) return "--";
  const parts = [];
  if (speed.walk) parts.push(speed.walk);
  if (speed.swim) parts.push(`swim ${speed.swim}`);
  if (speed.fly) parts.push(`fly ${speed.fly}`);
  if (speed.burrow) parts.push(`burrow ${speed.burrow}`);
  if (speed.climb) parts.push(`climb ${speed.climb}`);
  return parts.join(", ") || "--";
}

function formatAC(acList) {
  if (!acList || acList.length === 0) return { val: "--", str: "--" };
  const item = acList[0];
  return { val: item.value, str: `${item.value} (${item.type})` };
}

function formatSaves(profList) {
  if (!profList) return "None";
  const saves = profList
    .filter((p) => p.proficiency.name.startsWith("Saving Throw:"))
    .map((p) => `${p.proficiency.name.replace("Saving Throw:", "").trim()} +${p.value}`);
  return saves.length > 0 ? saves.join(", ") : "None";
}

function formatSkills(profList) {
  if (!profList) return "None";
  const skills = profList
    .filter((p) => p.proficiency.name.startsWith("Skill:"))
    .map((p) => `${p.proficiency.name.replace("Skill:", "").trim()} +${p.value}`);
  return skills.length > 0 ? skills.join(", ") : "None";
}

function formatSenses(senses) {
  if (!senses) return "--";
  const parts = [];
  if (senses.darkvision) parts.push(`darkvision ${senses.darkvision}`);
  if (senses.blindsight) parts.push(`blindsight ${senses.blindsight}`);
  if (senses.truesight) parts.push(`truesight ${senses.truesight}`);
  if (senses.tremorsense) parts.push(`tremorsense ${senses.tremorsense}`);
  parts.push(`passive Perception ${senses.passive_perception || 10}`);
  return parts.join(", ");
}

// Render Table
// Constrói cada linha via createElement/textContent (nunca innerHTML com
// dado vindo da API) — regra de segurança do CLAUDE.md do front, porque
// esse dado vem de fora (D&D API via backend), não é mock.
function celula(conteudo, { className, style } = {}) {
  const td = document.createElement("td");
  if (className) td.className = className;
  if (style) td.style.cssText = style;
  if (conteudo instanceof Node) {
    td.appendChild(conteudo);
  } else {
    td.textContent = conteudo;
  }
  return td;
}

function badge(className, texto) {
  const span = document.createElement("span");
  span.className = className;
  span.textContent = texto;
  return span;
}

function renderTable() {
  const tbody = document.getElementById("monsterTableBody");
  tbody.replaceChildren();
  document.getElementById("monsterCount").textContent = currentList.length;

  if (currentList.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 10;
    td.style.cssText = "text-align: center; padding: 2.5rem; color: #94A3B8;";
    td.textContent = "No monsters found matching your filters.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    renderPagination();
    return;
  }

  const totalPages = Math.max(1, Math.ceil(currentList.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = currentList.slice(start, start + PAGE_SIZE);

  pageItems.forEach((m) => {
    const tr = document.createElement("tr");
    if (selectedMonster && selectedMonster.index === m.index) {
      tr.classList.add("selected");
    }

    const ac = formatAC(m.armor_class);
    const speedStr = formatSpeed(m.speed);

    // Coluna do ícone: imagem se existir, senão a inicial do nome.
    const thumb = document.createElement("div");
    thumb.className = "monster-thumb";
    if (m.image) {
      const img = document.createElement("img");
      img.src = m.image;
      img.alt = m.name;
      img.addEventListener("error", () => {
        img.remove();
        thumb.textContent = m.name.charAt(0);
      });
      thumb.appendChild(img);
    } else {
      thumb.textContent = m.name.charAt(0);
    }

    const nameBox = document.createElement("div");
    nameBox.className = "cell-name-box";
    const nameInner = document.createElement("div");
    const nameLink = document.createElement("div");
    nameLink.className = "monster-name-link";
    nameLink.textContent = m.name;
    const sourceTag = document.createElement("div");
    sourceTag.className = "source-tag";
    sourceTag.textContent = m.url;
    nameInner.append(nameLink, sourceTag);
    nameBox.appendChild(nameInner);

    const btnExpand = document.createElement("button");
    btnExpand.className = "btn-statblock-expand";
    btnExpand.title = "Inspect Stat Block";
    btnExpand.textContent = "◆";

    tr.append(
      celula(thumb),
      celula(badge("badge-cr", String(m.challenge_rating))),
      celula(nameBox),
      celula(badge("badge-type", m.type)),
      celula(m.size, { style: "color: #94A3B8;" }),
      celula(String(ac.val), { className: "stat-ac" }),
      celula(String(m.hit_points), { className: "stat-hp" }),
      celula(m.alignment, { style: "font-size: 0.8rem; color: #CBD5E1; text-transform: capitalize;" }),
      celula(speedStr, { style: "font-size: 0.8rem; color: #94A3B8;" }),
      celula(btnExpand, { style: "text-align: center;" }),
    );

    tr.addEventListener("click", () => {
      selectMonster(m);
    });

    tbody.appendChild(tr);
  });

  renderPagination();
}

function renderPagination() {
  const totalPages = Math.max(1, Math.ceil(currentList.length / PAGE_SIZE));
  document.getElementById("paginationStatus").textContent = `Página ${currentPage} de ${totalPages}`;
  document.getElementById("btnPrevPage").disabled = currentPage <= 1;
  document.getElementById("btnNextPage").disabled = currentPage >= totalPages;
}

// Select and populate Wiki Dossier
function selectMonster(m) {
  selectedMonster = m;

  document.querySelectorAll("#monsterTableBody tr").forEach((r) => r.classList.remove("selected"));
  renderTable();

  const ac = formatAC(m.armor_class);

  document.getElementById("cardName").textContent = m.name;
  document.getElementById("cardCost").textContent = `CR ${m.challenge_rating}`;
  document.getElementById("cardType").textContent = `${m.type} • ${m.size}`;

  const sigAbility = m.special_abilities && m.special_abilities[0] ? m.special_abilities[0] : null;
  document.getElementById("cardAbility").textContent = sigAbility ? `${sigAbility.name}:` : "Special Attack:";
  document.getElementById("cardDesc").textContent = sigAbility ? ` ${sigAbility.desc.slice(0, 110)}...` : " Lethal strike.";
  document.getElementById("cardAc").textContent = `AC ${ac.val}`;
  document.getElementById("cardHp").textContent = `HP ${m.hit_points}`;

  // A D&D API não tem imagem pra todo monstro — sem fallback pra um
  // arquivo fixo (era um resquício do mock), só esconde a arte.
  const cardArtImg = document.getElementById("cardArt");
  if (m.image) {
    cardArtImg.src = m.image;
    cardArtImg.style.display = "block";
  } else {
    cardArtImg.removeAttribute("src");
    cardArtImg.style.display = "none";
  }

  document.getElementById("spotlightTitle").textContent = m.name;
  document.getElementById("spotlightSubmeta").textContent = `${m.size} ${m.type}, ${m.alignment} • Challenge ${m.challenge_rating} (${m.xp.toLocaleString()} XP)`;
  document.getElementById("spotlightLore").textContent = `Registered in D&D 2014 API at ${m.url}. Speed: ${formatSpeed(m.speed)}.`;

  document.getElementById("wikiName").textContent = m.name;
  document.getElementById("wikiTypeBadge").textContent = m.type;
  document.getElementById("wikiCrBadge").textContent = `CR ${m.challenge_rating} (${m.xp.toLocaleString()} XP)`;
  document.getElementById("wikiSubmeta").textContent = `${m.size} ${m.type}, ${m.alignment}`;

  document.getElementById("wikiAc").textContent = ac.str;
  document.getElementById("wikiHp").textContent = `${m.hit_points} (${m.hit_points_roll})`;
  document.getElementById("wikiSpeed").textContent = formatSpeed(m.speed);

  document.getElementById("wikiStr").textContent = m.strength;
  document.getElementById("wikiStrMod").textContent = calcMod(m.strength);
  document.getElementById("wikiDex").textContent = m.dexterity;
  document.getElementById("wikiDexMod").textContent = calcMod(m.dexterity);
  document.getElementById("wikiCon").textContent = m.constitution;
  document.getElementById("wikiConMod").textContent = calcMod(m.constitution);
  document.getElementById("wikiInt").textContent = m.intelligence;
  document.getElementById("wikiIntMod").textContent = calcMod(m.intelligence);
  document.getElementById("wikiWis").textContent = m.wisdom;
  document.getElementById("wikiWisMod").textContent = calcMod(m.wisdom);
  document.getElementById("wikiCha").textContent = m.charisma;
  document.getElementById("wikiChaMod").textContent = calcMod(m.charisma);

  document.getElementById("wikiSaves").textContent = formatSaves(m.proficiencies);
  document.getElementById("wikiSkills").textContent = formatSkills(m.proficiencies);
  document.getElementById("wikiSenses").textContent = formatSenses(m.senses);
  document.getElementById("wikiLanguages").textContent = m.languages || "--";
  document.getElementById("wikiProfBonus").textContent = `+${m.proficiency_bonus}`;

  const resRow = document.getElementById("wikiDamageResistancesRow");
  if (m.damage_resistances && m.damage_resistances.length > 0) {
    resRow.style.display = "block";
    document.getElementById("wikiDamageResistances").textContent = m.damage_resistances.join(", ");
  } else {
    resRow.style.display = "none";
  }

  const immRow = document.getElementById("wikiDamageImmunitiesRow");
  if (m.damage_immunities && m.damage_immunities.length > 0) {
    immRow.style.display = "block";
    document.getElementById("wikiDamageImmunities").textContent = m.damage_immunities.join(", ");
  } else {
    immRow.style.display = "none";
  }

  const condRow = document.getElementById("wikiConditionImmunitiesRow");
  if (m.condition_immunities && m.condition_immunities.length > 0) {
    condRow.style.display = "block";
    document.getElementById("wikiConditionImmunities").textContent = m.condition_immunities.map((c) => c.name).join(", ");
  } else {
    condRow.style.display = "none";
  }

  // special_abilities / actions / legendary_actions: desc e name vêm da
  // API, então nunca via innerHTML — monta o DOM na mão, só os badges
  // (dc/usage) que têm HTML fixo entram como nó.
  function entradaComTitulo(nome, desc, badges) {
    const div = document.createElement("div");
    const titulo = document.createElement("span");
    titulo.className = "entry-title";
    titulo.append(`${nome}.`, ...badges);
    div.append(titulo, ` ${desc}`);
    return div;
  }

  function badgeDc(dc) {
    if (!dc) return [];
    const span = document.createElement("span");
    span.className = "badge-dc";
    span.textContent = `DC ${dc.dc_value ?? ""} ${dc.dc_type ? dc.dc_type.name : ""}`.trim();
    return [span];
  }

  function badgeUsage(usage) {
    if (!usage) return [];
    const span = document.createElement("span");
    span.className = "badge-usage";
    span.textContent = `${usage.times ?? ""}/${usage.type ?? ""}`;
    return [span];
  }

  const traitsContainer = document.getElementById("wikiTraits");
  traitsContainer.replaceChildren();
  if (m.special_abilities && m.special_abilities.length > 0) {
    document.getElementById("wikiTraitsSection").style.display = "block";
    m.special_abilities.forEach((t) => {
      const div = entradaComTitulo(t.name, t.desc, [...badgeUsage(t.usage), ...badgeDc(t.dc)]);
      div.className = "trait-entry";
      traitsContainer.appendChild(div);
    });
  } else {
    document.getElementById("wikiTraitsSection").style.display = "none";
  }

  const actionsContainer = document.getElementById("wikiActions");
  actionsContainer.replaceChildren();
  if (m.actions && m.actions.length > 0) {
    document.getElementById("wikiActionsSection").style.display = "block";
    m.actions.forEach((a) => {
      const div = entradaComTitulo(a.name, a.desc, [...badgeUsage(a.usage), ...badgeDc(a.dc)]);
      div.className = "action-entry";
      actionsContainer.appendChild(div);
    });
  } else {
    document.getElementById("wikiActionsSection").style.display = "none";
  }

  const legContainer = document.getElementById("wikiLegendaryActions");
  legContainer.replaceChildren();
  if (m.legendary_actions && m.legendary_actions.length > 0) {
    document.getElementById("wikiLegendarySection").style.display = "block";
    m.legendary_actions.forEach((la) => {
      const div = entradaComTitulo(la.name, la.desc, []);
      div.className = "action-entry";
      legContainer.appendChild(div);
    });
  } else {
    document.getElementById("wikiLegendarySection").style.display = "none";
  }
}

// Filter Logic
function applyFilters() {
  currentPage = 1;
  const q = document.getElementById("searchInput").value.trim().toLowerCase();
  const minCr = parseFloat(document.getElementById("filterCrMin").value) || 0;
  const maxCr = parseFloat(document.getElementById("filterCrMax").value) || 30;
  const sizeFilter = document.getElementById("filterSize").value;
  const alignFilter = document.getElementById("filterAlignment").value;

  currentList = monstersDatabase.filter((m) => {
    const matchesQ = !q ||
      m.name.toLowerCase().includes(q) ||
      m.type.toLowerCase().includes(q) ||
      m.alignment.toLowerCase().includes(q) ||
      (m.languages && m.languages.toLowerCase().includes(q)) ||
      (m.special_abilities && m.special_abilities.some((s) => s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q))) ||
      (m.actions && m.actions.some((a) => a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q)));

    const matchesType = activeType === "all" || m.type.toLowerCase() === activeType.toLowerCase();
    const matchesCr = m.challenge_rating >= minCr && m.challenge_rating <= maxCr;
    const matchesSize = sizeFilter === "all" || m.size.toLowerCase() === sizeFilter.toLowerCase();
    const matchesAlign = alignFilter === "all" || m.alignment.toLowerCase().includes(alignFilter.toLowerCase());

    return matchesQ && matchesType && matchesCr && matchesSize && matchesAlign;
  });

  currentList.sort((a, b) => {
    let va = a[sortKey];
    let vb = b[sortKey];

    if (sortKey === "ac") {
      va = a.armor_class[0]?.value || 0;
      vb = b.armor_class[0]?.value || 0;
    }

    if (typeof va === "string") {
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    } else {
      return sortAsc ? va - vb : vb - va;
    }
  });

  renderTable();
}

document.getElementById("btnFilter").addEventListener("click", applyFilters);
document.getElementById("searchInput").addEventListener("input", applyFilters);
document.getElementById("searchInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") applyFilters();
});

document.getElementById("btnReset").addEventListener("click", () => {
  document.getElementById("searchInput").value = "";
  activeType = "all";
  document.getElementById("filterCrMin").value = "0";
  document.getElementById("filterCrMax").value = "30";
  document.getElementById("filterSize").value = "all";
  document.getElementById("filterAlignment").value = "all";

  document.querySelectorAll(".type-chip").forEach((c) => {
    c.classList.remove("active");
    if (c.dataset.type === "all") c.classList.add("active");
  });

  applyFilters();
});

document.getElementById("btnAdvToggle").addEventListener("click", () => {
  document.getElementById("advDrawer").classList.toggle("open");
  document.getElementById("btnAdvToggle").classList.toggle("active");
});

// Delegação de evento no container, não um listener por chip: os chips de
// tipo são regenerados em runtime (gerarChipsDeTipo), então um bind direto
// neles seria perdido a cada vez que a lista fosse recriada.
document.getElementById("typesBar").addEventListener("click", (e) => {
  const chip = e.target.closest(".type-chip");
  if (!chip) return;
  document.querySelectorAll(".type-chip").forEach((c) => c.classList.remove("active"));
  chip.classList.add("active");
  activeType = chip.dataset.type;
  applyFilters();
});

// Gera os chips de tipo a partir dos tipos realmente presentes nos dados
// carregados, em vez de uma lista fixa no HTML (que nascia incompleta e
// fazia tipos como "dragon" sumirem do filtro sem motivo aparente).
function gerarChipsDeTipo() {
  const typesBar = document.getElementById("typesBar");
  const tiposUnicos = [...new Set(monstersDatabase.map((m) => m.type))].sort();

  typesBar.querySelectorAll('.type-chip:not([data-type="all"])').forEach((c) => c.remove());

  tiposUnicos.forEach((tipo) => {
    const chip = document.createElement("div");
    chip.className = "type-chip";
    chip.dataset.type = tipo;
    chip.textContent = tipo.charAt(0).toUpperCase() + tipo.slice(1);
    typesBar.appendChild(chip);
  });
}

["filterCrMin", "filterCrMax", "filterSize", "filterAlignment"].forEach((id) => {
  document.getElementById(id).addEventListener("change", applyFilters);
});

document.getElementById("btnPrevPage").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderTable();
  }
});

document.getElementById("btnNextPage").addEventListener("click", () => {
  const totalPages = Math.max(1, Math.ceil(currentList.length / PAGE_SIZE));
  if (currentPage < totalPages) {
    currentPage++;
    renderTable();
  }
});

document.querySelectorAll("thead th[data-sort]").forEach((th) => {
  th.addEventListener("click", () => {
    const col = th.dataset.sort;
    if (sortKey === col) {
      sortAsc = !sortAsc;
    } else {
      sortKey = col;
      sortAsc = true;
    }
    applyFilters();
  });
});

document.getElementById("btnScrollToWiki").addEventListener("click", () => {
  document.getElementById("wikiSection").scrollIntoView({ behavior: "smooth" });
});

// Ingestão do dataset completo vindo do backend (substitui tudo).
function loadMonstersFromApi(monstersArray) {
  if (Array.isArray(monstersArray) && monstersArray.length > 0) {
    monstersDatabase.length = 0;
    monstersArray.forEach((m) => monstersDatabase.push(m));
    gerarChipsDeTipo();
    currentList = [...monstersDatabase];
    selectMonster(monstersDatabase[0]);
    applyFilters();
  }
}

// Usado só pelo retry de monstros que falharam no carregamento inicial:
// acrescenta sem descartar o que já carregou, diferente de
// loadMonstersFromApi (que substitui tudo).
function mergeMonstersFromApi(monstersArray) {
  if (Array.isArray(monstersArray) && monstersArray.length > 0) {
    monstersArray.forEach((m) => monstersDatabase.push(m));
    gerarChipsDeTipo();
    applyFilters();
  }
}

// Render inicial: a lista só chega depois do fetch abaixo, então não dá
// pra chamar selectMonster com monstersDatabase[0] (undefined) aqui.
renderTable();

// Fetch de verdade: consome o backend (GET /monsters + GET /monsters/:index,
// que batem na D&D API externa a cada request — decisão documentada no
// CLAUDE.md pra essa landing page). MonsterApiClient (monster-api.js) já
// tem fallback pra API pública e cache local.
const statusEl = document.getElementById("statusMsg");

// prefetchBatch já tenta de novo os índices que falharam antes de devolver
// (ver monster-api.js) — o que sobra em `failed` é o que não carregou nem
// na segunda tentativa. Guardado aqui pro botão de retry manual não
// precisar rebuscar o índice inteiro do zero.
let indicesFalhos = [];

function mostrarAvisoDeFalha() {
  statusEl.replaceChildren();
  statusEl.append(`${indicesFalhos.length} monstro(s) não carregaram. `);
  const btnRetry = document.createElement("button");
  btnRetry.type = "button";
  btnRetry.textContent = "Tentar novamente";
  btnRetry.className = "btn-page";
  btnRetry.addEventListener("click", tentarNovamenteFalhos);
  statusEl.appendChild(btnRetry);
}

async function tentarNovamenteFalhos() {
  const pendentes = indicesFalhos;
  indicesFalhos = [];
  statusEl.textContent = `Tentando carregar ${pendentes.length} monstro(s) de novo...`;

  const { results, failed } = await defaultMonsterClient.prefetchBatch(pendentes, 6);
  mergeMonstersFromApi(results);
  indicesFalhos = failed;

  if (failed.length > 0) {
    mostrarAvisoDeFalha();
  } else {
    statusEl.textContent = `${monstersDatabase.length} monstros carregados.`;
  }
}

async function carregarMonstrosDaApi() {
  try {
    statusEl.textContent = "Carregando índice de monstros...";
    const resumo = await defaultMonsterClient.getMonsterList();

    const indices = resumo.map((m) => m.index);
    const { results, failed } = await defaultMonsterClient.prefetchBatch(
      indices,
      6,
      (carregados, total) => {
        statusEl.textContent = `Carregando monstros... ${carregados}/${total}`;
      },
    );

    loadMonstersFromApi(results);
    indicesFalhos = failed;

    if (failed.length > 0) {
      mostrarAvisoDeFalha();
    } else {
      statusEl.textContent = `${monstersDatabase.length} monstros carregados.`;
    }
  } catch (erro) {
    console.error(erro);
    statusEl.textContent = "Não foi possível carregar os monstros. O backend está rodando em localhost:3000?";
  }
}

carregarMonstrosDaApi();
