import { beforeEach, describe, expect, it, afterEach } from 'vitest';

let setReference, clearReference;

beforeEach(async () => {                               // Minimales HTML-Gerüst für Zugriff auf DOM-Elemente
  // IDs sind hier nach chat-ui.js
  // Läuft VOR jedem einzelnen Test (saubere Ausgangslage)
  const store = {};
  global.localStorage = {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    // removing the localstorage
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      for (const key in store) delete store[key];
    }
  };

  document.body.innerHTML = `
    <div id="chat-messages"></div>
    <form id="input-form"></form>
    <input id="input-field" />
    <div id="chat-reference-container" class="hidden"></div>
    <span id="chat-reference-label"></span>
    <button id="clear-reference-btn"></button>
  `;
  const mod = await import('../src/chat.js');        // Lädt chat.js
  setReference = mod.setReference;                   // API-Funktion setReference aus chat.js
  clearReference = mod.clearReference;
});

afterEach(() => {
  localStorage.clear();
});


describe('chat references', () => {
  it('sets and clears reference', () => {
    setReference({ label: 'Item 1', modelId: 'm1', itemId: 1 });           // Aktiviere eine Referenz wie bei 3D → Chat-Flow
    const refText = document.getElementById('chat-reference-label');
    const container = document.getElementById('chat-reference-container');

    expect(refText.textContent).toBe('Item 1');                            // Erwartung: Text zeigt "Item 1"
    expect(container.classList.contains('hidden')).toBe(false);            // ...

    clearReference();

    expect(refText.textContent).toBe('');
    expect(container.classList.contains('hidden')).toBe(true);
  });
}); 