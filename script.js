/************************************************************
 * mi app — script.js (multipick ilimitado)
 * Funciona con tu hoja InputCentral y Formulario Google
 ************************************************************/

// ⚽ API-Football
const API_FOOTBALL_KEY = 'TU_API_FOOTBALL_KEY_AQUI'; // ← cambia por tu key real
const SEASON = 2025;

// 📄 Google Sheets
const GOOGLE_SHEETS_API_KEY = 'AIzaSyAXFN5M7p9bk9W2g7O9ohmZOWpeO_CpCek';
const SPREADSHEET_ID = '1NwSORch9sUhoGUSXYkDGwZlTLj9IJpwBykWCqeoL1L4';
const SHEET_NAME = 'InputCentral';
const RESULT_RANGE = `${SHEET_NAME}!H2:L2`;

// 📮 Google Forms (ya configurado)
const FORM_VIEW_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScPMq8walvuMKxyoHyEADajAu1RkqUoV_M499z2U22KiPamDA/viewform?usp=header';
const FORM_POST_URL = FORM_VIEW_URL.replace('/viewform', '/formResponse');

// Mapeo correcto de tus entry IDs
const ENTRY = {
  ID:        'entry.665021726',
  PARTIDO:   'entry.985276955',
  LIGA:      'entry.808650380',
  FECHA:     'entry.867530469',
  HORA:      'entry.488584768',
  MERCADO:   'entry.116813127',
  CUOTA:     'entry.2145825007'
};

// Mercados disponibles
const MARKETS = [
  '1X2',
  'Over/Under 0.5','Over/Under 1.5','Over/Under 2.5','Over/Under 3.5',
  'Ambos marcan',
  'Hándicap -0.5','Hándicap +0.5','Hándicap -1.0','Hándicap +1.0'
];

// Ligas principales + europeas
const COMPETITIONS = [
  { id: 140, name: 'LaLiga (España)' },
  { id: 39,  name: 'Premier League (Inglaterra)' },
  { id: 135, name: 'Serie A (Italia)' },
  { id: 78,  name: 'Bundesliga (Alemania)' },
  { id: 61,  name: 'Ligue 1 (Francia)' },
  { id: 2,   name: 'UEFA Champions League' },
  { id: 3,   name: 'UEFA Europa League' },
  { id: 848, name: 'UEFA Conference League' }
];

// Fallback de equipos (offline)
const FALLBACK_TEAMS = {
  140: ['Real Madrid','Barcelona','Atlético Madrid','Sevilla','Real Sociedad','Athletic Club','Valencia','Villarreal','Betis','Celta'],
  39:  ['Manchester City','Arsenal','Liverpool','Manchester United','Chelsea','Tottenham','Newcastle','Aston Villa','West Ham','Brighton'],
  135: ['Inter','Milan','Juventus','Napoli','Roma','Lazio','Atalanta','Fiorentina','Bologna','Torino'],
  78:  ['Bayern München','Borussia Dortmund','RB Leipzig','Bayer Leverkusen','Eintracht Frankfurt','SC Freiburg','Hoffenheim','Wolfsburg','Mainz','Stuttgart'],
  61:  ['Paris Saint-Germain','Marseille','Lyon','Monaco','Lille','Rennes','Nice','Nantes','Montpellier','Lens']
};

// --- VARIABLES DE ELEMENTOS ---
const $comp = document.getElementById('competicion');
const $home = document.getElementById('local');
const $away = document.getElementById('visitante');
const $fecha = document.getElementById('fecha');
const $hora = document.getElementById('hora');
const $marketsContainer = document.getElementById('marketsContainer');
const $addMarketBtn = document.getElementById('addMarketBtn');
const $removeMarketBtn = document.getElementById('removeMarketBtn');
const $result = document.getElementById('resultado');
const $form = document.getElementById('pickForm');

const teamsCache = new Map();

// --- INICIALIZAR ---
(function init() {
  populateCompetitions();
  addMarketRow();
  wireEvents();
})();

// --- EVENTOS ---
function wireEvents() {
  $comp.addEventListener('change', async () => {
    const leagueId = parseInt($comp.value, 10);
    notify('⏳ Cargando equipos...', 'gray');
    const teams = await fetchTeamsByLeague(leagueId);
    fillTeamSelects(teams);
    notify('');
  });

  $addMarketBtn.addEventListener('click', addMarketRow);
  $removeMarketBtn.addEventListener('click', removeLastMarketRow);

  document.getElementById('clearBtn').addEventListener('click', () => {
    $form.reset();
    $marketsContainer.innerHTML = '';
    addMarketRow();
    $result.innerHTML = '';
  });

  $form.addEventListener('submit', onSubmitPick);
}

// --- COMPETICIONES Y EQUIPOS ---
function populateCompetitions() {
  $comp.innerHTML = '<option value="">Selecciona...</option>';
  COMPETITIONS.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    $comp.appendChild(opt);
  });
}

async function fetchTeamsByLeague(leagueId) {
  if (teamsCache.has(leagueId)) return teamsCache.get(leagueId);
  try {
    const res = await fetch(`https://v3.football.api-sports.io/teams?league=${leagueId}&season=${SEASON}`, {
      headers: { 'x-apisports-key': API_FOOTBALL_KEY }
    });
    const data = await res.json();
    const teams = data.response.map(r => r.team.name);
    teamsCache.set(leagueId, teams);
    return teams;
  } catch {
    return FALLBACK_TEAMS[leagueId] || [];
  }
}

function fillTeamSelects(teams) {
  const opts = teams.map(t => `<option>${t}</option>`).join('');
  $home.innerHTML = `<option value="">Selecciona local…</option>${opts}`;
  $away.innerHTML = `<option value="">Selecciona visitante…</option>${opts}`;
}

// --- MERCADOS ILIMITADOS ---
function addMarketRow() {
  const div = document.createElement('div');
  div.className = 'market-item';
  div.innerHTML = `
    <select class="market-select">${MARKETS.map(m => `<option>${m}</option>`).join('')}</select>
    <input class="market-odds" type="number" step="0.01" min="1.01" placeholder="Cuota" required>
  `;
  $marketsContainer.appendChild(div);
}
function removeLastMarketRow() {
  const items = $marketsContainer.querySelectorAll('.market-item');
  if (items.length > 1) items[items.length - 1].remove();
}

// --- ENVÍO PICK ---
async function onSubmitPick(e) {
  e.preventDefault();
  const partido = `${$home.value} - ${$away.value}`;
  const liga = $comp.options[$comp.selectedIndex].text;
  const fecha = $fecha.value;
  const hora = $hora.value;
  const mercados = [...document.querySelectorAll('.market-select')].map(s => s.value).join(' / ');
  const cuotas = [...document.querySelectorAll('.market-odds')].map(i => i.value).join(' / ');

  const form = new FormData();
  form.append(ENTRY.ID, '');
  form.append(ENTRY.PARTIDO, partido);
  form.append(ENTRY.LIGA, liga);
  form.append(ENTRY.FECHA, fecha);
  form.append(ENTRY.HORA, hora);
  form.append(ENTRY.MERCADO, mercados);
  form.append(ENTRY.CUOTA, cuotas);

  await fetch(FORM_POST_URL, { method: 'POST', mode: 'no-cors', body: form });
  notify('✅ Pick enviado, calculando...', 'green');
  pollResultados(5, 1200);
}

// --- LECTURA RESULTADOS ---
async function pollResultados(intentos = 5, espera = 1000) {
  for (let i = 0; i < intentos; i++) {
    const ok = await obtenerResultados();
    if (ok) return;
    await new Promise(r => setTimeout(r, espera));
  }
  notify('⌛ Esperando resultados...', 'gray');
}

async function obtenerResultados() {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RESULT_RANGE}?key=${GOOGLE_SHEETS_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.values || !data.values[0]) return false;
    const [EV, Prob, Stake, Yield, Reco] = data.values[0];
    $result.innerHTML = `
      <h3>Resultados</h3>
      <p><b>EV:</b> ${EV ?? '-'} | <b>Probabilidad:</b> ${Prob ?? '-'}</p>
      <p><b>Stake:</b> ${Stake ?? '-'} | <b>Yield:</b> ${Yield ?? '-'}</p>
      <p><b>Recomendación:</b> ${Reco ?? '-'}</p>
    `;
    return true;
  } catch {
    return false;
  }
}

// --- MENSAJES ---
function notify(msg, color='black'){ $result.innerHTML = `<p style="color:${color}">${msg}</p>`; }
