/************************************************************
 * mi app — script.js
 * - Competiciones y equipos vía API-Football (season 2025/26)
 * - Fallback interno si la API falla (offline ready)
 * - Envío de pick a Google Sheets (InputCentral) + lectura resultados
 ************************************************************/

/* ============ 1) CONFIGURACIÓN ============ */
// 👉 Pega tus claves aquí:
const API_FOOTBALL_KEY = 'TU_API_FOOTBALL_KEY_AQUI';   // <-- tu key de API-Football
const API_KEY = 'TU_API_KEY_GOOGLE_SHEETS_AQUI';       // <-- tu API key de Google (Sheets)
const SPREADSHEET_ID = '1NwSORch9sUhoGUSXYkDGwZlTLj9IJpwBykWCqeoL1L4';
const SHEET_NAME = 'InputCentral';

// Temporada (API-Football usa integer de año inicial)
const SEASON = 2025;

// ⚠️ IMPORTANTE (Google Sheets):
// Con API Key normal, Google Sheets API permite lectura pública,
// pero el "append" puede requerir OAuth. Este script lo intenta.
// Si obtienes 401/403 al enviar, verás un aviso y el pick se guardará
// temporalmente en localStorage. Luego podrás configurar un Google Form
// como vía de escritura y yo te doy el código de envío por Form.
// (Mientras tanto, seguirás pudiendo LEER resultados.)

/* ============ 2) COMPETICIONES OBJETIVO ============ */
/*
  IDs de API-Football (usados ampliamente):
  - Premier League: 39
  - LaLiga: 140
  - Serie A: 135
  - Bundesliga: 78
  - Ligue 1: 61
  - UEFA Champions League: 2
  - UEFA Europa League: 3
  - UEFA Conference League: 848
*/
const COMPETITIONS = [
  { id: 140, name: 'LaLiga (España)' },
  { id: 39,  name: 'Premier League (Inglaterra)' },
  { id: 135, name: 'Serie A (Italia)' },
  { id: 78,  name: 'Bundesliga (Alemania)' },
  { id: 61,  name: 'Ligue 1 (Francia)' },
  { id: 2,   name: 'UEFA Champions League' },
  { id: 3,   name: 'UEFA Europa League' },
  { id: 848, name: 'UEFA Conference League' },
];

/* ============ 3) FALLBACK INTERNO (equipos mínimos) ============ */
/* Nota: Solo listado base para emergencia/offline.
   En condiciones normales, se cargarán TODOS los equipos desde la API. */
const FALLBACK_TEAMS = {
  140: ['Real Madrid', 'Barcelona', 'Atlético Madrid', 'Sevilla', 'Real Sociedad', 'Athletic Club', 'Valencia', 'Villarreal', 'Betis', 'Celta'],
  39:  ['Manchester City', 'Arsenal', 'Liverpool', 'Manchester United', 'Chelsea', 'Tottenham', 'Newcastle', 'Aston Villa', 'West Ham', 'Brighton'],
  135: ['Inter', 'Milan', 'Juventus', 'Napoli', 'Roma', 'Lazio', 'Atalanta', 'Fiorentina', 'Bologna', 'Torino'],
  78:  ['Bayern München', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen', 'Eintracht Frankfurt', 'SC Freiburg', 'Hoffenheim', 'Wolfsburg', 'Mainz', 'Stuttgart'],
  61:  ['Paris Saint-Germain', 'Marseille', 'Lyon', 'Monaco', 'Lille', 'Rennes', 'Nice', 'Nantes', 'Montpellier', 'Lens'],
  2:   ['(Se carga desde API-CL)'],
  3:   ['(Se carga desde API-EL)'],
  848: ['(Se carga desde API-Conference)']
};

/* ============ 4) MERCADOS DISPONIBLES ============ */
const MARKETS = [
  '1X2',
  'Over/Under 0.5',
  'Over/Under 1.5',
  'Over/Under 2.5',
  'Over/Under 3.5',
  'Ambos marcan',
  'Hándicap -0.5',
  'Hándicap +0.5',
  'Hándicap -1.0',
  'Hándicap +1.0'
];

/* ============ 5) SELECTORES Y ESTADO ============ */
const $comp = document.getElementById('competicion');
const $home = document.getElementById('local');
const $away = document.getElementById('visitante');
const $market = document.getElementById('mercado');
const $odds = document.getElementById('cuota');
const $result = document.getElementById('resultado');

const apiFootballBase = 'https://v3.football.api-sports.io';
const teamsCache = new Map(); // cache por leagueId

/* ============ 6) INICIALIZACIÓN INTERFAZ ============ */
function populateCompetitions() {
  $comp.innerHTML = '<option value="">Selecciona...</option>';
  for (const c of COMPETITIONS) {
    const opt = document.createElement('option');
    opt.value = String(c.id);
    opt.textContent = c.name;
    $comp.appendChild(opt);
  }
}

function populateMarkets() {
  $market.innerHTML = '';
  for (const m of MARKETS) {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    $market.appendChild(opt);
  }
}

/* ============ 7) CARGA DE EQUIPOS (API-FOOTBALL + FALLBACK) ============ */
async function fetchTeamsByLeague(leagueId) {
  if (teamsCache.has(leagueId)) return teamsCache.get(leagueId);

  try {
    const url = `${apiFootballBase}/teams?league=${leagueId}&season=${SEASON}`;
    const res = await fetch(url, {
      headers: { 'x-apisports-key': API_FOOTBALL_KEY }
    });
    if (!res.ok) throw new Error('API-Football error: ' + res.status);
    const data = await res.json();
    const teams = (data.response || [])
      .map(x => x.team && x.team.name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

    if (teams.length) {
      teamsCache.set(leagueId, teams);
      return teams;
    }
    // si API vacía, cae al fallback
    throw new Error('API-Football sin equipos');
  } catch (err) {
    console.warn('[Fallback] Usando equipos locales para liga', leagueId, err.message);
    const fallback = FALLBACK_TEAMS[leagueId] || [];
    teamsCache.set(leagueId, fallback);
    return fallback;
  }
}

function fillTeamSelects(teams) {
  const makeOptions = (list) => list.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
  $home.innerHTML = `<option value="">Selecciona local...</option>${makeOptions(teams)}`;
  $away.innerHTML = `<option value="">Selecciona visitante...</option>${makeOptions(teams)}`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[m]));
}

/* ============ 8) HANDLERS UI ============ */
$comp.addEventListener('change', async () => {
  const leagueId = parseInt($comp.value, 10);
  $home.disabled = true; $away.disabled = true;

  $result.innerHTML = '<p>⏳ Cargando equipos…</p>';
  const teams = await fetchTeamsByLeague(leagueId);
  fillTeamSelects(teams);
  $result.innerHTML = '';

  $home.disabled = false; $away.disabled = false;
});

/* ============ 9) ENVÍO DEL PICK A SHEETS + LECTURA RESULTADOS ============ */
document.getElementById('pickForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  // Validaciones básicas
  if (!$comp.value) return notify('Selecciona una competición.', 'red');
  if (!$home.value || !$away.value) return notify('Selecciona equipos.', 'red');
  if ($home.value === $away.value) return notify('Los equipos no pueden ser iguales.', 'red');
  if (!$odds.value || Number($odds.value) <= 1.0) return notify('Introduce una cuota válida (>1.0).', 'red');

  const pick = {
    competicion: $comp.options[$comp.selectedIndex].textContent,
    competitionId: $comp.value,
    local: $home.value,
    visitante: $away.value,
    mercado: $market.value,
    cuota: parseFloat($odds.value)
  };

  // Intento de APPEND (puede requerir OAuth; si falla, almacenamos localmente)
  const appendOk = await tryAppendPickToSheet(pick);

  // Mensajes + limpieza
  if (appendOk) {
    notify('✅ Pick enviado correctamente. Calculando…', 'green');
    e.target.reset();
    // tras reset, recarga mercados
    populateMarkets();
    // vuelve a bloquear selects hasta que se elija competición de nuevo
    $home.innerHTML = '<option value="">Selecciona local…</option>';
    $away.innerHTML = '<option value="">Selecciona visitante…</option>';

    // Poll de resultados (ajusta el rango a tu hoja)
    await pollResultados(5, 1200); // 5 intentos, 1.2s entre ellos
  } else {
    // Guardado local como emergencia
    savePickLocally(pick);
    notify('⚠️ No se pudo escribir en Sheets (posible restricción OAuth). Guardé el pick localmente. Puedo darte el envío vía Google Forms para escritura sin OAuth.', 'orange');
  }
});

async function tryAppendPickToSheet(pick) {
  // Ajusta el rango donde tu hoja espera el input.
  // Ejemplo: columnas A:E = competicion, local, visitante, mercado, cuota
  const range = `${SHEET_NAME}!A1:E1`;

  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&key=${API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        values: [[
          pick.competicion,
          pick.local,
          pick.visitante,
          pick.mercado,
          pick.cuota
        ]]
      })
    });

    if (!res.ok) {
      console.warn('Append fallo:', res.status, await safeText(res));
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Append error de red:', e.message);
    return false;
  }
}

async function safeText(res) {
  try { return await res.text(); } catch { return ''; }
}

/* ============ 10) LECTURA DE RESULTADOS (polling) ============ */
// Ajusta aquí el rango que devuelve tus cálculos (EV, Prob, Stake, etc.)
const RESULT_RANGE = `${SHEET_NAME}!H2:L2`;

async function pollResultados(intentos = 5, esperaMs = 1000) {
  for (let i = 0; i < intentos; i++) {
    const ok = await obtenerResultados();
    if (ok) return;
    await delay(esperaMs);
  }
  notify('⌛ Resultados no disponibles aún. Vuelve a intentarlo en unos segundos.', 'gray');
}

async function obtenerResultados() {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(RESULT_RANGE)}?key=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn('Lectura resultados fallo:', res.status);
      return false;
    }
    const data = await res.json();
    if (!data.values || !data.values[0]) return false;

    const [EV, Prob, Stake, Yield, Recomendacion] = data.values[0];

    $result.innerHTML = `
      <h3>Resultados</h3>
      <p><strong>EV:</strong> ${EV ?? '-'}</p>
      <p><strong>Probabilidad:</strong> ${Prob ?? '-'}</p>
      <p><strong>Stake:</strong> ${Stake ?? '-'}</p>
      <p><strong>Yield:</strong> ${Yield ?? '-'}</p>
      <p><strong>Recomendación:</strong> ${Recomendacion ?? '-'}</p>
    `;
    return true;
  } catch (e) {
    console.warn('Error leyendo resultados:', e.message);
    return false;
  }
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

/* ============ 11) UTILIDADES VARIAS ============ */
function notify(msg, color = 'black') {
  $result.innerHTML = `<p style="color:${color}">${msg}</p>`;
}

function savePickLocally(pick) {
  try {
    const key = 'miapp_picks_backup';
    const arr = JSON.parse(localStorage.getItem(key) || '[]');
    arr.push({ ...pick, ts: Date.now() });
    localStorage.setItem(key, JSON.stringify(arr));
  } catch (_) {}
}

/* ============ 12) ARRANQUE ============ */
(function init() {
  populateCompetitions();
  populateMarkets();
  // bloquea selects de equipos hasta elegir competición
  $home.innerHTML = '<option value="">Selecciona local…</option>';
  $away.innerHTML = '<option value="">Selecciona visitante…</option>';
})();
