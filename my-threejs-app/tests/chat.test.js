import { beforeEach, describe, expect, it, afterEach } from 'vitest';

let setComposerReference, clearComposerReference;

beforeEach(async () => { // sets up a minimal DOM for tests to simulate browser environment
                         // element IDs match chat-ui.js (DOM contract) to match query selectors used by the code
                         // runs before each test to reset state (test lifecycle)
  const store = {};
  global.localStorage = {
    getItem: (key) => (key in store ? store[key] : null), // read value from in-memory store (mock storage)
    setItem: (key, value) => {                            // write value to in-memory store (mock storage)
      store[key] = String(value);
    },
    removeItem: (key) => {                                // removes a single key from localStorage (delete)
      delete store[key];
    },
    clear: () => {                                        // clears all keys in the mock
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
  const mod = await import('../src/chat.js');        // dynamically import chat module (dynamic import) to bind to DOM elements created above
  setComposerReference = mod.setComposerReference;   // get API export
  clearComposerReference = mod.clearComposerReference;
});

afterEach(() => {
  localStorage.clear();
});


describe('chat references', () => {
  it('sets and clears reference', () => {
    setComposerReference({ label: 'Item 1', modelId: 'm1', itemId: 1 });   // simulate setting a 3D chat reference (reference)
    const refText = document.getElementById('chat-reference-label');
    const container = document.getElementById('chat-reference-container');

    expect(refText.textContent).toBe('Item 1');                            // expects label to show selected item
    expect(container.classList.contains('hidden')).toBe(false);            // expects chip to be visible

    clearComposerReference();

    expect(refText.textContent).toBe('');
    expect(container.classList.contains('hidden')).toBe(true);             // expects chip to hide after clearing
  });
}); 

// @ts-check
