async function ensureConfigLoaded() {
  if (typeof window.API_BASE !== 'undefined') return;
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = chrome.runtime.getURL('config.js');
    s.onload = () => resolve();
    s.onerror = (e) => reject(e);
    document.head.appendChild(s);
  });
}

async function obtenerDatos() {
  try {
    await ensureConfigLoaded();
    const response = await fetch(`${window.API_BASE}/datos`);
    const data = await response.json();
    document.getElementById('respuesta').innerText = data.mensaje;
  } catch (error) {
    document.getElementById('respuesta').innerText = "Error al conectar con Bun";
    console.error(error);
  }
}
obtenerDatos();