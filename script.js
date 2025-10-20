// === CONFIGURACIÓN ===
const API_KEY = '// === CONFIGURACIÓN ===
const API_KEY = '// === CONFIGURACIÓN ===
const API_KEY = 'AIzaSyAXFN5M7p9bk9W2g7O9ohmZOWpeO_CpCek'; // ← Pega aquí tu API key
const SPREADSHEET_ID = '1NwSORch9sUhoGUSXYkDGwZlTLj9IJpwBykWCqeoL1L4'; // ID de tu hoja real
const SHEET_NAME = 'InputCentral';

// === ENVÍO DE PICK ===
document.getElementById('pickForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const pick = {
    competicion: document.getElementById('competicion').value,
    local: document.getElementById('local').value,
    visitante: document.getElementById('visitante').value,
    mercado: document.getElementById('mercado').value,
    cuota: document.getElementById('cuota').value,
  };

  const range = `${SHEET_NAME}!A1:E1`; // columnas donde se escriben los datos

  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED&key=${API_KEY}`,
      {
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
      }
    );

    if (response.ok) {
      document.getElementById('resultado').innerHTML = "<p>✅ Pick enviado correctamente. Calculando...</p>";
      obtenerResultados();
    } else {
      document.getElementById('resultado').innerHTML = "<p>❌ Error al enviar el pick.</p>";
    }
  } catch (error) {
    console.error(error);
    document.getElementById('resultado').innerHTML = "<p>⚠️ Error de conexión.</p>";
  }
});

// === LECTURA DE RESULTADOS ===
async function obtenerResultados() {
  const range = `${SHEET_NAME}!H2:L2`; // ajusta si tus resultados están en otras celdas
  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`);
    const data = await res.json();
    if (data.values) {
      const [EV, Prob, Stake, Yield, Recomendacion] = data.values[0];
      document.getElementById('resultado').innerHTML += `
        <h3>Resultados:</h3>
        <p>EV: ${EV}</p>
        <p>Probabilidad: ${Prob}</p>
        <p>Stake: ${Stake}</p>
        <p>Yield: ${Yield}</p>
        <p>Recomendación: ${Recomendacion}</p>
      `;
    } else {
      document.getElementById('resultado').innerHTML += "<p>⚙️ Esperando resultados...</p>";
    }
  } catch (error) {
    console.error(error);
    document.getElementById('resultado').innerHTML += "<p>⚠️ Error al obtener resultados.</p>";
  }
}
const SPREADSHEET_ID = '1NwSORch9sUhoGUSXYkDGwZlTLj9IJpwBykWCqeoL1L4'; // ID de tu hoja real
const SHEET_NAME = 'InputCentral';

// === ENVÍO DE PICK ===
document.getElementById('pickForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const pick = {
    competicion: document.getElementById('competicion').value,
    local: document.getElementById('local').value,
    visitante: document.getElementById('visitante').value,
    mercado: document.getElementById('mercado').value,
    cuota: document.getElementById('cuota').value,
  };

  const range = `${SHEET_NAME}!A1:E1`; // columnas donde se escriben los datos

  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED&key=${API_KEY}`,
      {
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
      }
    );

    if (response.ok) {
      document.getElementById('resultado').innerHTML = "<p>✅ Pick enviado correctamente. Calculando...</p>";
      obtenerResultados();
    } else {
      document.getElementById('resultado').innerHTML = "<p>❌ Error al enviar el pick.</p>";
    }
  } catch (error) {
    console.error(error);
    document.getElementById('resultado').innerHTML = "<p>⚠️ Error de conexión.</p>";
  }
});

// === LECTURA DE RESULTADOS ===
async function obtenerResultados() {
  const range = `${SHEET_NAME}!H2:L2`; // ajusta si tus resultados están en otras celdas
  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`);
    const data = await res.json();
    if (data.values) {
      const [EV, Prob, Stake, Yield, Recomendacion] = data.values[0];
      document.getElementById('resultado').innerHTML += `
        <h3>Resultados:</h3>
        <p>EV: ${EV}</p>
        <p>Probabilidad: ${Prob}</p>
        <p>Stake: ${Stake}</p>
        <p>Yield: ${Yield}</p>
        <p>Recomendación: ${Recomendacion}</p>
      `;
    } else {
      document.getElementById('resultado').innerHTML += "<p>⚙️ Esperando resultados...</p>";
    }
  } catch (error) {
    console.error(error);
    document.getElementById('resultado').innerHTML += "<p>⚠️ Error al obtener resultados.</p>";
  }
}'; // ← Pega aquí tu API key
const SPREADSHEET_ID = '1NwSORch9sUhoGUSXYkDGwZlTLj9IJpwBykWCqeoL1L4'; // ID de tu hoja real
const SHEET_NAME = 'InputCentral';

// === ENVÍO DE PICK ===
document.getElementById('pickForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const pick = {
    competicion: document.getElementById('competicion').value,
    local: document.getElementById('local').value,
    visitante: document.getElementById('visitante').value,
    mercado: document.getElementById('mercado').value,
    cuota: document.getElementById('cuota').value,
  };

  const range = `${SHEET_NAME}!A1:E1`; // columnas donde se escriben los datos

  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED&key=${API_KEY}`,
      {
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
      }
    );

    if (response.ok) {
      document.getElementById('resultado').innerHTML = "<p>✅ Pick enviado correctamente. Calculando...</p>";
      obtenerResultados();
    } else {
      document.getElementById('resultado').innerHTML = "<p>❌ Error al enviar el pick.</p>";
    }
  } catch (error) {
    console.error(error);
    document.getElementById('resultado').innerHTML = "<p>⚠️ Error de conexión.</p>";
  }
});

// === LECTURA DE RESULTADOS ===
async function obtenerResultados() {
  const range = `${SHEET_NAME}!H2:L2`; // ajusta si tus resultados están en otras celdas
  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`);
    const data = await res.json();
    if (data.values) {
      const [EV, Prob, Stake, Yield, Recomendacion] = data.values[0];
      document.getElementById('resultado').innerHTML += `
        <h3>Resultados:</h3>
        <p>EV: ${EV}</p>
        <p>Probabilidad: ${Prob}</p>
        <p>Stake: ${Stake}</p>
        <p>Yield: ${Yield}</p>
        <p>Recomendación: ${Recomendacion}</p>
      `;
    } else {
      document.getElementById('resultado').innerHTML += "<p>⚙️ Esperando resultados...</p>";
    }
  } catch (error) {
    console.error(error);
    document.getElementById('resultado').innerHTML += "<p>⚠️ Error al obtener resultados.</p>";
  }
}
