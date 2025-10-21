/****************************************************
 * ⚽ Apuestas PRO - Script v2 (API + Respaldo Local)
 * Funciona online/offline y sin OAuth
 ****************************************************/

const API_KEY = "6eecb8f6b2msh1fa9a857ab6cc3cp1d8e02jsnfe1c0e19b80f";
const TEMPORADA = 2025;
const FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLScPMq8walvuMKxyoHyEADajAu1RkqUoV_M499z2U22KiPamDA/formResponse";

document.addEventListener("DOMContentLoaded", async () => {
  await cargarLigas();
  inicializarEventos();
});

/***********************
 * CARGAR LIGAS
 ***********************/
async function cargarLigas() {
  const select = document.getElementById("competicion");
  select.innerHTML = '<option value="">Cargando ligas...</option>';

  // Cache local
  const cache = localStorage.getItem("ligas");
  if (cache) {
    try {
      const data = JSON.parse(cache);
      rellenarLigas(data);
      return;
    } catch {}
  }

  try {
    const res = await fetch(`https://v3.football.api-sports.io/leagues?season=${TEMPORADA}`, {
      headers: { "x-apisports-key": API_KEY }
    });
    const data = await res.json();

    if (data.response && data.response.length > 0) {
      localStorage.setItem("ligas", JSON.stringify(data.response));
      rellenarLigas(data.response);
    } else {
      console.warn("No se encontraron ligas, usando respaldo local...");
      cargarLigasRespaldo();
    }
  } catch (error) {
    console.error("Error al cargar ligas:", error);
    cargarLigasRespaldo();
  }
}

/***********************
 * RESPALDO LOCAL
 ***********************/
function cargarLigasRespaldo() {
  const ligasBackup = [
    { id: 140, name: "La Liga", country: "España" },
    { id: 39, name: "Premier League", country: "Inglaterra" },
    { id: 135, name: "Serie A", country: "Italia" },
    { id: 78, name: "Bundesliga", country: "Alemania" },
    { id: 61, name: "Ligue 1", country: "Francia" },
    { id: 2, name: "Champions League", country: "Europa" },
    { id: 3, name: "Europa League", country: "Europa" },
    { id: 848, name: "Conference League", country: "Europa" }
  ];

  const data = ligasBackup.map(l => ({
    league: { id: l.id, name: l.name },
    country: { name: l.country }
  }));

  rellenarLigas(data);
}

function rellenarLigas(ligas) {
  const select = document.getElementById("competicion");
  select.innerHTML = '<option value="">Selecciona liga...</option>';
  ligas.forEach(l => {
    const opt = document.createElement("option");
    opt.value = l.league.id;
    opt.textContent = `${l.league.name} (${l.country.name})`;
    select.appendChild(opt);
  });
}

/***********************
 * CARGAR EQUIPOS
 ***********************/
async function cargarEquipos(leagueId) {
  if (!leagueId) return;

  const localSel = document.getElementById("local");
  const visitSel = document.getElementById("visitante");

  localSel.innerHTML = '<option value="">Cargando...</option>';
  visitSel.innerHTML = '<option value="">Cargando...</option>';

  const cache = localStorage.getItem("equipos_" + leagueId);
  if (cache) {
    try {
      const data = JSON.parse(cache);
      rellenarEquipos(data);
      return;
    } catch {}
  }

  try {
    const res = await fetch(`https://v3.football.api-sports.io/teams?league=${leagueId}&season=${TEMPORADA}`, {
      headers: { "x-apisports-key": API_KEY }
    });
    const data = await res.json();

    if (data.response && data.response.length > 0) {
      localStorage.setItem("equipos_" + leagueId, JSON.stringify(data.response));
      rellenarEquipos(data.response);
    } else {
      console.warn("No se encontraron equipos, usando respaldo local...");
      cargarEquiposRespaldo(leagueId);
    }
  } catch (error) {
    console.error("Error al cargar equipos:", error);
    cargarEquiposRespaldo(leagueId);
  }
}

/***********************
 * EQUIPOS DE RESPALDO
 ***********************/
function cargarEquiposRespaldo(leagueId) {
  let equiposBackup = [];
  switch (parseInt(leagueId)) {
    case 140: equiposBackup = ["Real Madrid", "Barcelona", "Atlético Madrid", "Sevilla"]; break;
    case 39: equiposBackup = ["Manchester City", "Arsenal", "Liverpool", "Chelsea"]; break;
    case 135: equiposBackup = ["Juventus", "Inter", "Milan", "Napoli"]; break;
    case 78: equiposBackup = ["Bayern", "Dortmund", "Leipzig", "Leverkusen"]; break;
    case 61: equiposBackup = ["PSG", "Marseille", "Lyon", "Monaco"]; break;
    default: equiposBackup = ["Equipo A", "Equipo B"];
  }

  const lista = equiposBackup.map(name => ({ team: { name } }));
  rellenarEquipos(lista);
}

function rellenarEquipos(lista) {
  const localSel = document.getElementById("local");
  const visitSel = document.getElementById("visitante");
  localSel.innerHTML = '<option value="">Selecciona local...</option>';
  visitSel.innerHTML = '<option value="">Selecciona visitante...</option>';
  lista.forEach(t => {
    const opt1 = document.createElement("option");
    const opt2 = document.createElement("option");
    opt1.value = t.team.name;
    opt1.textContent = t.team.name;
    opt2.value = t.team.name;
    opt2.textContent = t.team.name;
    localSel.appendChild(opt1);
    visitSel.appendChild(opt2);
  });
}

/***********************
 * MERCADOS ILIMITADOS
 ***********************/
function añadirMercado() {
  const cont = document.getElementById("marketsContainer");
  const div = document.createElement("div");
  div.className = "market-item";
  div.innerHTML = `
    <select class="tipo">
      <option value="1X2">1X2</option>
      <option value="Over/Under 0.5">Over/Under 0.5</option>
      <option value="Over/Under 1.5">Over/Under 1.5</option>
      <option value="Over/Under 2.5">Over/Under 2.5</option>
      <option value="Ambos marcan">Ambos marcan</option>
      <option value="Doble oportunidad">Doble oportunidad</option>
    </select>
    <input type="number" step="0.01" min="1.01" placeholder="Cuota" class="cuota" />
  `;
  cont.appendChild(div);
}

function quitarMercado() {
  const cont = document.getElementById("marketsContainer");
  if (cont.children.length > 1) cont.removeChild(cont.lastElementChild);
}

/***********************
 * GUARDAR PICK
 ***********************/
function guardarPick(e) {
  e.preventDefault();

  const ligaSel = document.getElementById("competicion");
  const liga = ligaSel.options[ligaSel.selectedIndex].text;
  const local = document.getElementById("local").value;
  const visitante = document.getElementById("visitante").value;
  const fecha = document.getElementById("fecha").value;
  const hora = document.getElementById("hora").value;

  if (!liga || !local || !visitante || !fecha || !hora) {
    mostrarMensaje("⚠️ Completa todos los campos.", "rojo");
    return;
  }

  const mercados = Array.from(document.querySelectorAll(".market-item")).map(m => ({
    tipo: m.querySelector(".tipo").value,
    cuota: m.querySelector(".cuota").value || "-"
  }));

  const params = new URLSearchParams();
// 🧾 Armar el campo “Partido” en el formato correcto: “Local-Visitante”
const partido = `${local.replace(/\s+/g, '')}-${visitante.replace(/\s+/g, '')}`;

params.append("entry.665021726", Date.now()); // ID
params.append("entry.985276955", partido);    // Partido (formato único)
params.append("entry.808650380", liga);       // Liga
params.append("entry.867530469", fecha);      // Fecha
params.append("entry.488584768", hora);       // Hora
params.append("entry.116813127", mercados.map(m => m.tipo).join(" | ")); // Mercado
params.append("entry.2145825007", mercados.map(m => m.cuota).join(" | ")); // Cuota

  fetch(FORM_URL, { method: "POST", body: params })
    .then(() => mostrarMensaje("✅ Pick enviado correctamente.", "verde"))
    .catch(err => {
      console.error("Error al enviar:", err);
      mostrarMensaje("❌ Error al guardar el pick.", "rojo");
    });
}

/***********************
 * LIMPIAR Y EVENTOS
 ***********************/
function limpiarFormulario() {
  document.getElementById("pickForm").reset();
  const cont = document.getElementById("marketsContainer");
  cont.innerHTML = "";
  añadirMercado();
  mostrarMensaje("Formulario limpio ✅", "gris");
}

function mostrarMensaje(texto, color) {
  const msg = document.getElementById("resultado");
  msg.textContent = texto;
  msg.style.color =
    color === "rojo" ? "#d93025" :
    color === "verde" ? "#188038" :
    "#444";
  setTimeout(() => msg.textContent = "", 4000);
}

function inicializarEventos() {
  document.getElementById("competicion").addEventListener("change", e => {
    cargarEquipos(e.target.value);
  });
  document.getElementById("addMarketBtn").addEventListener("click", añadirMercado);
  document.getElementById("removeMarketBtn").addEventListener("click", quitarMercado);
  document.getElementById("clearBtn").addEventListener("click", limpiarFormulario);
  document.getElementById("pickForm").addEventListener("submit", guardarPick);
  añadirMercado();
}
