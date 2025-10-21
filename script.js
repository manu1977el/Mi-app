/******************************************************
 * ⚽ Apuestas PRO — v2.1 (Híbrido: API + Respaldo)
 * - Ligas y equipos con fallback inmediato (sin quedarse vacío)
 * - Compatible con API-Football (API-Sports o RapidAPI)
 * - Envío a Google Forms (tus entry.*)
 * - Mercados ilimitados
 ******************************************************/

/* ====== CONFIG ====== */
// 👉 Si tienes clave directa de api-sports.io, ponla aquí:
const APISPORTS_KEY = ""; // p.ej. "xxxxxxxxxxxxxxxxxxxxxxxxxxxx"

// 👉 Si en su lugar usas RapidAPI, pon la clave aquí:
const RAPIDAPI_KEY = ""; // p.ej. "xxxxxxxxxxxxxxxxxxxxxxxxxxxx"

// Temporada objetivo (las API a veces no devuelven futuras, por eso hay fallback)
const TEMPORADA = 2025;

// Google Forms (tu URL correcta con /formResponse):
const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLScPMq8walvuMKxyoHyEADajAu1RkqUoV_M499z2U22KiPamDA/formResponse";

/* ====== RESPALDOS ====== */
const LIGAS_BACKUP = [
  { id: 140, name: "La Liga", country: "España" },
  { id: 39,  name: "Premier League", country: "Inglaterra" },
  { id: 135, name: "Serie A", country: "Italia" },
  { id: 78,  name: "Bundesliga", country: "Alemania" },
  { id: 61,  name: "Ligue 1", country: "Francia" },
  { id: 2,   name: "Champions League", country: "Europa" },
  { id: 3,   name: "Europa League", country: "Europa" },
  { id: 848, name: "Conference League", country: "Europa" }
];

const EQUIPOS_BACKUP = {
  140: ["Real Madrid", "Barcelona", "Atlético Madrid", "Sevilla", "Valencia", "Villarreal"],
  39:  ["Manchester City", "Arsenal", "Liverpool", "Chelsea", "Tottenham", "Manchester United"],
  135: ["Inter", "Milan", "Juventus", "Napoli", "Roma", "Lazio"],
  78:  ["Bayern", "Dortmund", "Leipzig", "Leverkusen", "Frankfurt"],
  61:  ["PSG", "Marseille", "Lyon", "Monaco", "Lille"],
  2:   ["Real Madrid", "Manchester City", "Bayern", "PSG"],
  3:   ["Liverpool", "Roma", "Sevilla", "Leverkusen"],
  848: ["Fiorentina", "West Ham", "AZ Alkmaar", "Brugge"]
};

/* ====== ARRANQUE ====== */
document.addEventListener("DOMContentLoaded", async () => {
  pintarLigas(LIGAS_BACKUP.map(x => ({ league: { id: x.id, name: x.name }, country: { name: x.country } })));
  // Luego intentamos mejorar con API (si responde, sustituye el listado)
  await cargarLigasAPI();
  inicializarEventos();
  // un mercado por defecto
  if (!document.querySelector(".mercado-row")) añadirMercado();
});

/* ====== UTIL ====== */
function fetchWithTimeout(url, options = {}, ms = 8000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    fetch(url, options).then(r => { clearTimeout(t); resolve(r); }, e => { clearTimeout(t); reject(e); });
  });
}

/* ====== LIGAS ====== */
async function cargarLigasAPI() {
  try {
    let url, headers;
    if (APISPORTS_KEY) {
      url = `https://v3.football.api-sports.io/leagues?season=${TEMPORADA}`;
      headers = { "x-apisports-key": APISPORTS_KEY };
    } else if (RAPIDAPI_KEY) {
      url = `https://api-football-v1.p.rapidapi.com/v3/leagues?season=${TEMPORADA}`;
      headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": "api-football-v1.p.rapidapi.com"
      };
    } else {
      // No hay claves; mantenemos el backup mostrado
      return;
    }

    const res = await fetchWithTimeout(url, { headers }, 9000);
    const data = await res.json();

    if (data && data.response && data.response.length) {
      localStorage.setItem("ligas", JSON.stringify(data.response));
      pintarLigas(data.response);
    }
  } catch (e) {
    // Silencioso: mantenemos las de respaldo
    console.warn("No se pudo actualizar ligas con la API; usando respaldo.", e);
  }
}

function pintarLigas(ligas) {
  const sel = document.getElementById("liga");
  sel.innerHTML = '<option value="">Selecciona liga...</option>';
  ligas.forEach(l => {
    if (l.league && l.country) {
      const opt = document.createElement("option");
      opt.value = l.league.id;
      opt.textContent = `${l.league.name} (${l.country.name})`;
      sel.appendChild(opt);
    }
  });
}

/* ====== EQUIPOS ====== */
async function cargarEquipos(ligaId) {
  const localSel = document.getElementById("local");
  const visitSel = document.getElementById("visitante");
  localSel.innerHTML = '<option value="">Cargando…</option>';
  visitSel.innerHTML = '<option value="">Cargando…</option>';

  // 1) Intento de API
  try {
    let url, headers;
    if (APISPORTS_KEY) {
      url = `https://v3.football.api-sports.io/teams?league=${ligaId}&season=${TEMPORADA}`;
      headers = { "x-apisports-key": APISPORTS_KEY };
    } else if (RAPIDAPI_KEY) {
      url = `https://api-football-v1.p.rapidapi.com/v3/teams?league=${ligaId}&season=${TEMPORADA}`;
      headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": "api-football-v1.p.rapidapi.com"
      };
    }

    if (url) {
      const res = await fetchWithTimeout(url, { headers }, 9000);
      const data = await res.json();
      if (data && data.response && data.response.length) {
        localStorage.setItem("equipos_" + ligaId, JSON.stringify(data.response));
        return pintarEquipos(data.response);
      }
    }
  } catch (e) {
    console.warn("Fallo API equipos; tiro de respaldo / cache.", e);
  }

  // 2) Cache local si existiera
  const cache = localStorage.getItem("equipos_" + ligaId);
  if (cache) {
    try { pintarEquipos(JSON.parse(cache)); return; } catch {}
  }

  // 3) Respaldo estático
  const lista = (EQUIPOS_BACKUP[ligaId] || ["Equipo A", "Equipo B"]).map(n => ({ team: { name: n } }));
  pintarEquipos(lista);
}

function pintarEquipos(lista) {
  const localSel = document.getElementById("local");
  const visitSel = document.getElementById("visitante");
  localSel.innerHTML = '<option value="">Selecciona local...</option>';
  visitSel.innerHTML = '<option value="">Selecciona visitante...</option>';
  lista.forEach(t => {
    const name = t.team?.name || t.name || t;
    const o1 = document.createElement("option");
    o1.value = name; o1.textContent = name;
    const o2 = o1.cloneNode(true);
    localSel.appendChild(o1);
    visitSel.appendChild(o2);
  });
}

/* ====== MERCADOS ====== */
function añadirMercado() {
  const wrap = document.getElementById("mercadosContainer");
  const div = document.createElement("div");
  div.className = "mercado-row";
  div.innerHTML = `
    <select class="tipo">
      <option value="1X2">1X2</option>
      <option value="Over/Under 0.5">Over/Under 0.5</option>
      <option value="Over/Under 1.5">Over/Under 1.5</option>
      <option value="Over/Under 2.5">Over/Under 2.5</option>
      <option value="Ambos marcan">Ambos marcan</option>
      <option value="Hándicap">Hándicap</option>
      <option value="Doble oportunidad">Doble oportunidad</option>
    </select>
    <input type="number" class="cuota" step="0.01" min="1.01" placeholder="Cuota" />
  `;
  wrap.appendChild(div);
}

function quitarMercado() {
  const rows = document.querySelectorAll(".mercado-row");
  if (rows.length > 1) rows[rows.length - 1].remove();
}

/* ====== ENVÍO GOOGLE FORM ====== */
// columnas: Marca temporal | ID | Partido | Liga | Fecha | Hora | Mercado | Cuota
async function guardarPick() {
  const selLiga = document.getElementById("liga");
  const ligaTxt = selLiga.value ? selLiga.options[selLiga.selectedIndex].text : "";
  const local = document.getElementById("local").value;
  const visitante = document.getElementById("visitante").value;
  const fecha = document.getElementById("fecha").value;
  const hora = document.getElementById("hora").value;

  if (!ligaTxt || !local || !visitante || !fecha || !hora) {
    alert("⚠️ Completa todos los campos antes de guardar.");
    return;
  }

  const partido = `${local} - ${visitante}`;
  const mercados = Array.from(document.querySelectorAll(".mercado-row"))
    .map(r => ({ tipo: r.querySelector(".tipo").value, cuota: r.querySelector(".cuota").value }))
    .filter(x => x.tipo && x.cuota);

  if (!mercados.length) {
    alert("⚠️ Añade al menos un mercado con su cuota.");
    return;
  }

  // Enviar una fila por cada mercado
  for (const m of mercados) {
    const fd = new FormData();
    fd.append("entry.665021726", generarID());   // ID
    fd.append("entry.985276955", partido);       // Partido
    fd.append("entry.808650380", ligaTxt);       // Liga
    fd.append("entry.867530469", fecha);         // Fecha
    fd.append("entry.488584768", hora);          // Hora
    fd.append("entry.1168131272", m.tipo);       // Mercado
    fd.append("entry.2145825007", m.cuota);      // Cuota

    try {
      // no-cors: Google Forms responde sin CORS; esto igualmente inserta la fila
      await fetch(FORM_URL, { method: "POST", mode: "no-cors", body: fd });
    } catch (err) {
      console.error("Error al enviar al Form, guardo offline:", err);
      guardarOffline({ partido, liga: ligaTxt, fecha, hora, mercado: m.tipo, cuota: m.cuota });
    }
  }

  alert("✅ Pick guardado correctamente");
  limpiarFormulario();
}

/* ====== AUXILIARES ====== */
function generarID() {
  // ID simple y único por milisegundo + aleatorio corto
  return `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function guardarOffline(pick) {
  const arr = JSON.parse(localStorage.getItem("picksOffline") || "[]");
  arr.push(pick);
  localStorage.setItem("picksOffline", JSON.stringify(arr));
}

function limpiarFormulario() {
  document.getElementById("liga").selectedIndex = 0;
  document.getElementById("local").innerHTML = '<option value="">Selecciona local...</option>';
  document.getElementById("visitante").innerHTML = '<option value="">Selecciona visitante...</option>';
  document.getElementById("fecha").value = "";
  document.getElementById("hora").value = "";
  document.getElementById("mercadosContainer").innerHTML = "";
  añadirMercado();
}

function inicializarEventos() {
  document.getElementById("liga").addEventListener("change", e => cargarEquipos(e.target.value));
  document.getElementById("addMarket").addEventListener("click", añadirMercado);
  document.getElementById("removeMarket").addEventListener("click", quitarMercado);
  document.getElementById("savePick").addEventListener("click", guardarPick);
  document.getElementById("clear").addEventListener("click", limpiarFormulario);
}
