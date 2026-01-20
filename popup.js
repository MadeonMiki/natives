async function obtenerDatos() {
  try {
    const response = await fetch('http://localhost:3000/datos');
    const data = await response.json();
    document.getElementById('respuesta').innerText = data.mensaje;
  } catch (error) {
    document.getElementById('respuesta').innerText = "Error al conectar con Bun";
    console.error(error);
  }
}
obtenerDatos();