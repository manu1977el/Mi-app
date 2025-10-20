// ======= Utiles =======
const $ = s => document.querySelector(s);
const ls = {
  get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k,v) => localStorage.setItem(k, JSON.stringify(v))
};

const state = {
  season: 2025,
  apiKey: "",
  leagues: [],
  teamsByLeague: {},
  picks: ls.get("picks") || []
};

// ======= Inicialización =======
window.addEventListener("DOMContentLoaded", () => {
  // PWA install button
  let deferredPrompt; window.addEventListener('beforeinstallprompt', (e)=>{ e.preventDefault(); deferredPrompt=e; $('#btnInstall').hidden=false; });
  $('#btnInstall').onclick = async () => { if(!deferredPrompt) return; deferredPrompt.prompt(); deferredPrompt = null; $('#btnInstall').hidden = true; };

  // Ajustes
  $('#btnSettings').onclick = ()=> $('#settings').showModal();
  $('#btnSaveSettings').onclick = (e)=> {
    e.preventDefault();
    state.apiKey = $('#apiKey').value.trim();
    state.season = Number($('#season').value)||2025;
    ls.set('settings', {apiKey:state.apiKey, season:state.season});
    $('#settings').close();
    bootstrap().catch(console.error);
  };
  const saved = ls.get('settings'); if(saved){ state.apiKey=saved.apiKey||""; state.season=saved.season||2025; $('#apiKey').value=state.apiKey; $('#season').value=state.season; }

  // Eventos
  $('#league').addEventListener('change', onLeagueChange);
  $('#btnCalc').addEventListener('click', onCalc);
  $('#btnSave').addEventListener('click', onSave);
  $('#btnExport').addEventListener('click', exportCSV);

  renderHistory();
  bootstrap(); // carga ligas/equipos
});

// ======= API-Football (client only) =======
// Docs oficiales: usar header x-apisports-key y endpoints v3 /leagues, /teams.  [oai_citation:0‡api-football](https://www.api-football.com/documentation-v3?utm_source=chatgpt.com)
async function bootstrap(){
  if(!state.apiKey){ return; }
  // Ligas (fútbol) disponibles para la temporada
  const leagues = await apiGet(`https://v3.football.api-sports.io/leagues?season=${state.season}`);
  state.leagues = (leagues?.response||[])
    .filter(l => l.type === 'League' || l.type === 'Cup')
    .map(l => ({ id:l.league.id, name:`${l.league.name} (${l.country.name})` }))
    .sort((a,b)=> a.name.localeCompare(b.name));
  fillSelect($('#league'), state.leagues, 'Selecciona competición');
  // Si ya había una liga seleccionada, recargar equipos
  if($('#league').value) await loadTeams($('#league').value);
}

async function onLeagueChange(){
  const leagueId = $('#league').value;
  await loadTeams(leagueId);
}

async function loadTeams(leagueId){
  if(!leagueId) return;
  if(!state.teamsByLeague[leagueId]){
    const teams = await apiGet(`https://v3.football.api-sports.io/teams?league=${leagueId}&season=${state.season}`);
    state.teamsByLeague[leagueId] = (teams?.response||[]).map(t => ({ id:t.team.id, name:t.team.name }));
  }
  const teams = state.teamsByLeague[leagueId].sort((a,b)=> a.name.localeCompare(b.name));
  fillSelect($('#homeTeam'), teams, 'Equipo local');
  fillSelect($('#awayTeam'), teams, 'Equipo visitante');
}

function fillSelect(sel, items, placeholder){
  sel.innerHTML = `<option value="">${placeholder}</option>` + items.map(o=>`<option value="${o.id}">${o.name}</option>`).join('');
}

// Petición genérica
async function apiGet(url){
  const res = await fetch(url, { headers: { 'x-apisports-key': state.apiKey } });
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

// ======= Cálculos (ejemplo base, adapta a tus fórmulas) =======
// Convierte cuota decimal -> prob implícita
const implied = odds => odds>0 ? 1/odds : 0;
// EV: valor esperado por unidad apostada si estimas p_real
const ev = (p, odds) => (p * (odds - 1)) - (1 - p);

// Colorea badge
const badge = (label, value) => {
  const cls = value > 0 ? 'green' : 'red';
  const pct = isFinite(value) ? (value*100).toFixed(1)+'%' : '—';
  return `<span class="badge ${cls}">${label}: ${pct}</span>`;
};

function onCalc(){
  const oddsH = parseFloat($('#oddsH').value);
  const oddsD = parseFloat($('#oddsD').value);
  const oddsA = parseFloat($('#oddsA').value);
  const oddsOver25 = parseFloat($('#oddsOver25').value);
  const oddsUnder25 = parseFloat($('#oddsUnder25').value);
  const oddsBTTSYes = parseFloat($('#oddsBTTSYes').value);

  // Prob implícitas (puedes reemplazar por tus modelos al migrarlos)
  const pH = implied(oddsH), pD = implied(oddsD), pA = implied(oddsA);
  const norm = pH + pD + pA;
  const pHn = pH/norm, pDn = pD/norm, pAn = pA/norm;

  // EV contra sus propias probabilidades implícitas (base). Lo normal es usar tus p_reales.
  const evH = ev(pHn, oddsH);
  const evD = ev(pDn, oddsD);
  const evA = ev(pAn, oddsA);

  const evOver = ev(implied(oddsUnder25) ? 1 - implied(oddsUnder25) : implied(oddsOver25), oddsOver25);
  const evUnder = ev(implied(oddsOver25) ? 1 - implied(oddsOver25) : implied(oddsUnder25), oddsUnder25);
  const evBTTS = ev( implied(oddsBTTSYes), oddsBTTSYes ); // placeholder

  $('#results').innerHTML = [
    badge('1', evH), badge('X', evD), badge('2', evA),
    badge('Over 2.5', evOver), badge('Under 2.5', evUnder),
    badge('BTTS Sí', evBTTS)
  ].join(' ');

  $('#btnSave').disabled = false;
}

function onSave(){
  const league = $('#league').selectedOptions[0]?.text || '';
  const home = $('#homeTeam').selectedOptions[0]?.text || '';
  const away = $('#awayTeam').selectedOptions[0]?.text || '';
  const kickoff = $('#kickoff').value;
  const row = {
    id: crypto.randomUUID(),
    league, home, away, kickoff,
    oddsH: $('#oddsH').value, oddsD: $('#oddsD').value, oddsA: $('#oddsA').value,
    oddsOver25: $('#oddsOver25').value, oddsUnder25: $('#oddsUnder25').value, oddsBTTSYes: $('#oddsBTTSYes').value,
    resultsHTML: $('#results').innerHTML,
    ts: Date.now()
  };
  state.picks.unshift(row); ls.set('picks', state.picks);
  renderHistory();
  $('#btnSave').disabled = true;
}

function renderHistory(){
  const box = $('#history'); if(!box) return;
  box.innerHTML = state.picks.map(p => `
    <div class="pick">
      <div><strong>${p.league}</strong> — ${p.home} vs ${p.away}</div>
      <div>${new Date(p.kickoff).toLocaleString()}</div>
      <div class="badges">${p.resultsHTML}</div>
    </div>
  `).join('');
}

function exportCSV(){
  const rows = [
    ["id","league","home","away","kickoff","oddsH","oddsD","oddsA","oddsOver25","oddsUnder25","oddsBTTSYes","ts"]
  ];
  state.picks.forEach(p=> rows.push([p.id,p.league,p.home,p.away,p.kickoff,p.oddsH,p.oddsD,p.oddsA,p.oddsOver25,p.oddsUnder25,p.oddsBTTSYes,p.ts]));
  const csv = rows.map(r=> r.map(cell=> `"${String(cell).replaceAll('"','""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `picks_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}
