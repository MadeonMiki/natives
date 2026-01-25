importScripts('config.js');

// Background service worker to perform network requests for the content script

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'FETCH_DATOS') {
    console.log('Background received FETCH_DATOS, text=', message?.text);
    fetch(`${API_BASE}/datos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message?.text ?? '' }),
    })
      .then(async (res) => {
        if (!res.ok) {
          console.error('Background fetch HTTP error', res.status, res.statusText);
          sendResponse({ success: false, error: `HTTP ${res.status} ${res.statusText}` });
          return;
        }
        const data = await res.json();
        console.log('Background fetched data:', data);
        sendResponse({ success: true, data });
      })
      .catch((err) => {
        console.error('Background fetch failed:', err);
        sendResponse({ success: false, error: err?.message || String(err) });
      });

    // Keep the message channel open for async response
    return true;
  }
});
