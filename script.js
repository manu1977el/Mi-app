/******************************************************
 ⚽ Apuestas PRO — v2 (API-Football + Google Forms)
 Funciona online/offline sin OAuth
******************************************************/

const API_KEY = "6eecb8f6b2msh1fa9a857ab6c3cp1d8e02jsnfe1c0e19b80f";
const TEMPORADA = 2025;
const FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLScPMq8walvuMKxyoHyEADajAu1RkqUoV_M499z2U22KiPamDA/formResponse";

document.addEventListener("DOMContentLoaded", async () => {
  await cargarLigas();
  inicializarEventos();
});

/******************************************************
 CARGAR LIGAS Y EQUIPOS
******************************************************/
async function cargarLigas() {
  const selectLiga = document.getElementById("liga");
  selectLiga.innerHTML = `<option>Cargando ligas...</option>`;
  try {
    const res = await fetch("https://api-football-v1.p.rapidapi.com/v3/leagues?season=" + TEMPORADA, {
      headers: {
        "x-rapidapi-key": API_KEY,
        "x-rapidapi-host": "api-football-v1.p.rapidapi.com"
      }
    });
    const data = await res.json();
    const ligas = data.response.filter(l => l.league && l.country);
    selectLiga.innerHTML = `<option value="">Selecciona liga...</option>`;
    ligas.forEach(l => {
      const opt = document.createElement("option");
      opt.value = l.league.id;
      opt.textContent = `${l.league.name} (${l.country.name})`;
      selectLiga.appendChild(opt);
    });
  } catch (err) {
    selectLiga.innerHTML = `<option>⚠️ No se encontraron ligas.</option>`;
    console.error(err);
  }
}

async function cargarEquipos(ligaId) {
  const selectLocal = document.getElementById("local");
  const selectVisitante = document.getElementById("visitante");
  selectLocal.innerHTML = `<option>Cargando equipos...</option>`;
  selectVisitante.innerHTML = `<option>Cargando equipos...</option>`;
  try {
    const res = await fetch(`https://api-football-v1.p.rapidapi.com/v3/teams?league=${ligaId}&season=${TEMPORADA}`, {
      headers: {
        "x-rapidapi-key": API_KEY,
        "x-rapidapi-host": "api-football-v1.p.rapidapi.com"
      }
    });
    const data = await res.json();
    const equipos = data.response;
    selectLocal.innerHTML = `<option value="">Selecciona local...</option>`;
    selectVisitante.innerHTML = `<option value="">Selecciona visitante...</option>`;
    equipos.forEach(t => {
      const opt1 = document.createElement("option");
      opt1.value = t.team.name;
      opt1.textContent = t.team.name;
      const opt2 = opt1.cloneNode(true);
      selectLocal.appendChild(opt1);
      selectVisitante.appendChild(opt2);
    });
  } catch (err) {
    console.error(err);
    selectLocal.innerHTML = `<option>⚠️ Error cargando equipos.</option>`;
  }
}

/******************************************************
 EVENTOS
******************************************************/
function inicializarEventos() {
  document.getElementById("liga").addEventListener("change", (e) => {
    const ligaId = e.target.value;
    if (ligaId) cargarEquipos(ligaId);
  });

  document.getElementById("addMarket").addEventListener("click", () => {
    const div = document.createElement("div");
    div.classList.add("mercado-row");
    div.innerHTML = `
      <select class="tipo">
        <option value="1X2">1X2</option>
        <option value="Over/Under 0.5">Over/Under 0.5</option>
        <option value="Over/Under 1.5">Over/Under 1.5</option>
        <option value="Ambos marcan">Ambos marcan</option>
        <option value="Hándicap">Hándicap</option>
      </select>
      <input type="number" step="0.01" placeholder="Cuota" class="cuota">
    `;
    document.getElementById("mercadosContainer").appendChild(div);
  });

  document.getElementById("removeMarket").addEventListener("click", () => {
    const rows = document.querySelectorAll(".mercado-row");
    if (rows.length > 1) rows[rows.length - 1].remove();
  });

  document.getElementById("savePick").addEventListener("click", guardarPick);
  document.getElementById("clear").addEventListener("click", limpiarFormulario);
}

/******************************************************
 GUARDAR PICK (Google Form)
******************************************************/
async function guardarPick() {
  const liga = document.querySelector("#liga option:checked").textContent;
  const local = document.querySelector("#local").value;
  const visitante = document.querySelector("#visitante").value;
  const fecha = document.querySelector("#fecha").value;
  const hora = document.querySelector("#hora").value;

  if (!liga || !local || !visitante || !fecha || !hora) {
    alert("⚠️ Completa todos los campos antes de guardar.");
    return;
  }

  const partido = `${local} - ${visitante}`;
  const mercados = [];
  document.querySelectorAll(".mercado-row").forEach(row => {
    const tipo = row.querySelector(".tipo").value;
    const cuota = row.querySelector(".cuota").value;
    if (tipo && cuota) mercados.push({ tipo, cuota });
  });

  if (mercados.length === 0) {
    alert("⚠️ Añade al menos un mercado con su cuota.");
    return;
  }

  for (const m of mercados) {
    const formData = new FormData();
    formData.append("entry.665021726", generarID());
    formData.append("entry.985276955", partido);
    formData.append("entry.808650380", liga);
    formData.append("entry.867530469", fecha);
    formData.append("entry.488584768", hora);
    formData.append("entry.1168131272", m.tipo);
    formData.append("entry.2145825007", m.cuota);

    try {
      await fetch(FORM_URL, { method: "POST", mode: "no-cors", body: formData });
      console.log("✅ Pick enviado:", partido, m.tipo, m.cuota);
    } catch (err) {
      console.error("❌ Error enviando pick:", err);
      guardarLocalmente({ partido, liga, fecha, hora, mercado: m.tipo, cuota: m.cuota });
    }
  }

  alert("✅ Pick guardado correctamente");
  limpiarFormulario();
}

/******************************************************
 FUNCIONES AUXILIARES
******************************************************/
function generarID() {
  return Math.floor(Math.random() * 1000000).toString().padStart(3, "0");
}

function guardarLocalmente(pick) {
  const guardados = JSON.parse(localStorage.getItem("picksOffline") || "[]");
  guardados.push(pick);
  localStorage.setItem("picksOffline", JSON.stringify(guardados));
}

function limpiarFormulario() {
  document.querySelector("#liga").selectedIndex = 0;
  document.querySelector("#local").innerHTML = `<option value="">Selecciona local...</option>`;
  document.querySelector("#visitante").innerHTML = `<option value="">Selecciona visitante...</option>`;
  document.querySelector("#fecha").value = "";
  document.querySelector("#hora").value = "";
  document.querySelector("#mercadosContainer").innerHTML = `
    <div class="mercado-row">
      <select class="tipo">
        <option value="1X2">1X2</option>
        <option value="Over/Under 0.5">Over/Under 0.5</option>
        <option value="Over/Under 1.5">Over/Under 1.5</option>
        <option value="Ambos marcan">Ambos marcan</option>
        <option value="Hándicap">Hándicap</option>
      </select>
      <input type="number" step="0.01" placeholder="Cuota" class="cuota">
    </div>
  `;
}
