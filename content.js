// Variables globales
let popup = null;
let currentInput = null;
let currentPopup = null;
let currentTarget = null;
let show =true; // Variable para controlar la visibilidad del popup

function createPopup() {    
  const popup = document.createElement('div');
  popup.className = 'phrase-popup';
  popup.style.display = 'none';
  popup.innerHTML = `
    <button class="close-popup">&times;</button>
    <div class="phrase">Testing de prueba escrita en input</div>
    <div class="loading" style="display: none;">Cargando...</div>
  `;
  document.body.appendChild(popup);

  // Agregar evento para cerrar el popup al hacer clic en el botón
  popup.querySelector('.close-popup').addEventListener('click', () => {
    console.log("Cerrando popup"); // Depuración
    close(); // Llama a la función close() para cerrar el popup
  });

  return popup;
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

    const rect = input.getBoundingClientRect();

    // Posicionar popup siempre hacia arriba
    popup.style.display = 'block';
    popup.style.top = `${window.scrollY + rect.top - popup.offsetHeight - 5}px`; // Siempre arriba
    popup.style.left = `${window.scrollX + rect.left}px`;

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
    popup.style.top = `${window.scrollY + rect.top - newHeight - 5}px`; // Ajustar posición hacia arriba
}
function hidePopup() {
  if (currentPopup) {
    currentPopup.style.display = 'none';
    currentTarget = null;
  }
}

// Control de eventos mejorado
document.addEventListener('focusin', (e) => {
  if (show== false) return; // Si el popup no debe mostrarse, salir de la función
  if (e.target.matches('input, textarea, [contenteditable="true"]')) {
    showTranslation(e.target);
  }
});

document.addEventListener('focusout', (e) => {
    // Esperar un poco antes de ocultar para permitir clics en el popup
    setTimeout(() => {
      if (!currentPopup?.contains(document.activeElement)) {
        hidePopup();
      }
    }, 200);
  
});

// Manejo de clics en el popup
document.addEventListener('click', (e) => {

    if (e.target.classList.contains('phrase')) {
        const text = e.target.innerText.trim(); // Obtiene el texto del popup
        console.log("Texto del popup:", text); // Depuración
        if (currentInput) {
            console.log("Elemento actual (currentInput):", currentInput); // Depuración
            // Si el elemento actual es un input o textarea
            if (currentInput.matches('input, textarea')) {
                currentInput.value = text; // Asigna el texto al input o textarea
            } 
            // Si el elemento actual es un div con contenteditable
            else if (currentInput.matches('[contenteditable="true"]')) {
                currentInput.innerText = text; // Asigna el texto al div
            }
            currentInput.focus(); // Mantiene el foco en el elemento actual
            close(); // Cierra el popup después de asignar el texto
        } else {
            console.warn("No hay un elemento actual (currentInput) para asignar el texto.");
        }
    }
    e.stopPropagation(); // Evita que el clic cierre el popup de forma no deseada
}
  );
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

document.addEventListener('keydown', (e) => {
  // Detectar la combinación de teclas Ctrl + Shift + P
  if (e.key === 'Tab') {
    e.preventDefault(); // Evita el comportamiento predeterminado de la tecla Tab
    console.log("Tecla Tab detectada"); // Depuración
    if (currentInput) {
      console.log("Elemento actual (currentInput):", currentInput); // Depuración
      // Si el elemento actual es un input o textarea
      if (currentInput.matches('input, textarea')) {
          currentInput.value = popup.querySelector('.phrase').textContent; // Asigna el texto al input o textarea
          currentInput.setSelectionRange(currentInput.value.length, currentInput.value.length);
      } 
      // Si el elemento actual es un div con contenteditable
      else if (currentInput.matches('[contenteditable="true"]')) {
          currentInput.innerText = popup.querySelector('.phrase').textContent; // Asigna el texto al div
          const range = document.createRange();
          const selection = window.getSelection();
          range.selectNodeContents(currentInput);
          range.collapse(false); // Colapsa el rango al final del contenido
          selection.removeAllRanges();
          selection.addRange(range);
      }
      currentInput.focus(); // Mantiene el foco en el elemento actual
      close(); // Cierra el popup después de asignar el texto
    } else {
      console.warn("No hay un elemento actual (currentInput) para asignar el texto.");
    }
  }
  if (e.ctrlKey && e.shiftKey && e.key === 'P') {
    e.preventDefault(); // Evita el comportamiento predeterminado de la tecla Tab
      console.log("Atajo de teclado detectado: Ctrl + Shift + P"); // Depuración
      show =true; // Cambia la variable de control a true
      if (popup) {
          // Mostrar el popup nuevamente
          popup.style.display = 'block';
          popup.style.top = `${window.scrollY + currentInput.getBoundingClientRect().top - popup.offsetHeight - 5}px`;
          popup.style.left = `${window.scrollX + currentInput.getBoundingClientRect().left}px`;

          console.log("Popup mostrado nuevamente.");
      } else {
          console.warn("El popup no está inicializado.");
      }
  }
});

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
}, 500));

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

// Prevenir aparición automática en recarga
window.addEventListener('beforeunload', hidePopup);