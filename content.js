// Variables globales
let popup = null;
let currentInput = null;
let currentPopup = null;
let currentTarget = null;
let show = true; // Variable para controlar la visibilidad del popup
let _rafId = null; // requestAnimationFrame id para throttle

function createPopup() {    
  const popup = document.createElement('div');
  popup.className = 'phrase-popup';
  popup.style.display = 'none';
  popup.style.position = 'absolute';
  popup.style.zIndex = '999999';
  popup.innerHTML = `
    <button class="close-popup">&times;</button>
    <div class="phrase">Testing de prueba escrita en input</div>
    <div class="loading" style="display: none;">Cargando...</div>
  `;

  document.body.appendChild(popup);

  // Agregar evento para cerrar el popup al hacer clic en el botón
  popup.querySelector('.close-popup').addEventListener('click', () => {
    popup.style.display = 'none';
  });

  return popup;
}
// Devuelve el rect que representa el origen del texto (caret o bounding rect)
function getOriginClientRect(el) {
  try {
    if (!el) return null;
    // Para elementos contenteditable, intentar obtener el rect de la selección/caret
    if (el.matches && el.matches('[contenteditable="true"]')) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        const range = sel.getRangeAt(0).cloneRange();
        // Si hay rects disponibles para la selección, usar el primero
        const rects = range.getClientRects();
        if (rects && rects.length) return rects[0];
      }
    }

    // Para inputs/textarea y fallback usar boundingClientRect del elemento
    return el.getBoundingClientRect();
  } catch (err) {
    return el.getBoundingClientRect();
  }
}

function updatePopupPosition() {
  if (!popup || !currentInput) return;
  if (popup.style.display === 'none') return;

  const rect = getOriginClientRect(currentInput) || currentInput.getBoundingClientRect();
  if (!rect) return;

  const newHeight = popup.offsetHeight || 0;
  const top = window.scrollY + rect.top - newHeight - 5;
  const left = window.scrollX + rect.left;

  popup.style.top = `${Math.max(0, top)}px`;
  popup.style.left = `${Math.max(0, left)}px`;
}

function scheduleReposition() {
  if (_rafId) cancelAnimationFrame(_rafId);
  _rafId = requestAnimationFrame(() => {
    updatePopupPosition();
    _rafId = null;
  });
}
function close() {
  if (popup) {
    popup.style.display = 'none';
    show = false; // Cambia la variable de control a false
    hidePopup();
  }
}
// Traducir usando MyMemory API (Gratis)
async function translateToEnglish(text) {
  try {
    const resp = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'FETCH_DATOS', text }, (r) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(r);
        }
      });
    });

    if (!resp) {
      console.error('No response from background');
      return '(Error: sin respuesta del background)';
    }
    if (!resp.success) {
      console.error('Background fetch error:', resp.error);
      return `(Error: ${resp.error})`;
    }
    const data = resp.data;
    console.log(data.mensaje ?? data.mesanje ?? data);
    return data.mensaje ?? data.mesanje ?? '(Sin respuesta)';
  } catch (error) {
    console.error('Fetch failed:', error);
    return '(Error de red: no se pudo conectar al servidor)';
  }
}
// Mostrar traducción
async function showTranslation(input) {
    if (!(input instanceof HTMLElement)) {
        console.error("El argumento 'input' no es un elemento del DOM:", input);
        return;
    }
    if (!popup) popup = createPopup();
  currentInput = input; 

    // Obtener el texto dependiendo del tipo de elemento
    const text = input.matches('input, textarea') ? input.value : input.innerText.trim();

    if (!text) {
        //console.warn("No hay texto para traducir");
        hidePopup(); // Oculta el popup si no hay texto
    }

    // Mostrar popup y posicionarlo usando la función común
    popup.style.display = 'block';
    updatePopupPosition();

    // Ajustar el tamaño dinámicamente
    popup.style.maxHeight = '200px'; // Máximo alto permitido
    popup.style.overflowY = 'auto'; // Habilitar scroll si el contenido excede el tamaño

    // Mostrar loading
    popup.querySelector('.phrase').style.display = 'none';
    popup.querySelector('.loading').style.display = 'block';

    // Traducir y mostrar resultado
    const translation = await translateToEnglish(text);

    popup.querySelector('.phrase').textContent = translation || "(Sin traducción)";
    popup.querySelector('.phrase').style.display = 'block';
    popup.querySelector('.loading').style.display = 'none';

    // Recalcular la posición si el contenido cambia
    const newHeight = popup.offsetHeight;
    updatePopupPosition();
}
function hidePopup() {
  if (popup) {
    popup.style.display = 'none';
  }
  currentTarget = null;
  currentInput = null;
}

document.addEventListener('input', debounce((e) => {
  if (show== false) return; // Si el popup no debe mostrarse, salir de la función

    if (e.target.matches('input, textarea')) {
        console.log("Input/textarea detectado:", e.target); // Depuración
        const value = e.target.value.trim(); // Obtiene el valor del input o textarea
        console.log("Valor del input/textarea:", value); // Depuración
        if (value) {
            showTranslation(e.target); // Llama a la función con el elemento
        }else if (value === "" || value === null || value === undefined || value === " ")  {
            hidePopup(); // Oculta el popup si no hay texto
        }
    }
}, 500));

document.addEventListener('keyup', debounce((e) => {
  if (show== false) return; // Si el popup no debe mostrarse, salir de la función

    if (e.target.matches('[contenteditable="true"]')) {
        console.log("Div contenteditable detectado:", e.target); // Depuración
        const value = e.target.innerText.trim(); // Obtiene el texto del div
        console.log("Valor del div contenteditable:", value); // Depuración
        if (value) {
            showTranslation(e.target); // Llama a la función con el elemento
        }else if (value === "" || value === null || value === undefined || value === " ")  {
            hidePopup(); // Oculta el popup si no hay texto
        }
    }
}, 1000));

  // Función debounce para evitar muchas llamadas API
function debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

// Inicialización segura
if (document.readyState === 'complete') {
  if (!currentPopup) createPopup();
} else {
  document.addEventListener('DOMContentLoaded', () => {
    if (!currentPopup) createPopup();
  });
}

// Reposicionar popup durante scroll/resize/selection changes
window.addEventListener('scroll', scheduleReposition, true);
window.addEventListener('resize', scheduleReposition);

// Prevenir aparición automática en recarga
window.addEventListener('beforeunload', hidePopup);